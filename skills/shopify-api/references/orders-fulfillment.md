# Shopify Orders and Fulfillment

## Use When

- You need to sync orders from Shopify into the ERP.
- You need to mark an order as fulfilled on Shopify and send tracking numbers.
- You need to sync refunds or transaction status updates.

## API References

**Standard version:** `2025-10`

### Major Endpoints:
- `GET /admin/api/2025-10/orders.json` (List/filter orders)
- `GET /admin/api/2025-10/orders/{order_id}.json` (Get single order)
- `GET /admin/api/2025-10/orders/{order_id}/fulfillment_orders.json` (List fulfillment orders - **MANDATORY**)
- `POST /admin/api/2025-10/fulfillments.json` (Create a fulfillment)
- `POST /admin/api/2025-10/orders/{order_id}/refunds/calculate.json` (Calculate refunds)
- `POST /admin/api/2025-10/orders/{order_id}/refunds.json` (Create a refund)

---

## 1. Fulfillment Workflow (CRITICAL)

> [!IMPORTANT]
> **Legacy fulfillment creation is fully deprecated.** You CANNOT directly call `POST /orders/{order_id}/fulfillments.json`. You must use the **FulfillmentOrder workflow**.

Instead of fulfilling an Order directly, you must fulfill its associated **FulfillmentOrder** resource. A single Order can have multiple FulfillmentOrders representing different warehouses/locations or shipping schedules.

### Step-by-Step Fulfillment Flow:

1. **Retrieve Fulfillment Orders:** Fetch the list of fulfillment orders associated with the Shopify Order ID.
   `GET /admin/api/2025-10/orders/{order_id}/fulfillment_orders.json`
   
   Response payload highlights:
   ```json
   {
     "fulfillment_orders": [
       {
         "id": 1046000859,
         "order_id": 450789469,
         "status": "open",
         "location_id": 68845568420,
         "line_items": [
           {
             "id": 1058737573,
             "line_item_id": 907293758,
             "quantity": 1,
             "fulfillable_quantity": 1
           }
         ]
       }
     ]
   }
   ```

2. **Create Fulfillment:** Send a request to fulfill the items, referencing the `fulfillment_order_id` and the specific fulfillment order line items.
   `POST /admin/api/2025-10/fulfillments.json`
   
   **Payload:**
   ```json
   {
     "fulfillment": {
       "message": "Fulfilled by ERP System",
       "notify_customer": true,
       "tracking_info": {
         "number": "1Z999AA10123456784",
         "url": "https://www.ups.com/track?loc=en_US",
         "company": "UPS"
       },
       "line_items_by_fulfillment_order": [
         {
           "fulfillment_order_id": 1046000859,
           "fulfillment_order_line_items": [
             {
               "id": 1058737573,
               "quantity": 1
             }
           ]
         }
       ]
     }
   }
   ```

---

## 2. Order Payload Details (REST)

### Status Mapping:
- **`financial_status`**: `pending` (unpaid), `authorized` (credit reserved), `paid` (captured), `partially_refunded`, `refunded`, `voided`.
- **`fulfillment_status`**: `null` (unfulfilled), `fulfilled`, `partial`, `restocked` (cancelled/returned).

### Address Fields:
Shipping details reside in `shipping_address`, which contains nested fields: `address1`, `address2`, `city`, `province` (state), `country`, `zip`, `phone`, `first_name`, `last_name`.

---

## 3. Refunds

To process a refund from the ERP back to Shopify:

1. **Calculate Refund:** Submit the items and quantities to calculate taxes, duties, and amounts to return.
   `POST /admin/api/2025-10/orders/{order_id}/refunds/calculate.json`
2. **Submit Refund:** Post the results of the calculation to commit the refund.
   `POST /admin/api/2025-10/orders/{order_id}/refunds.json`

---

## 4. PHP SDK Code Examples

### Retrieve Fulfillment Orders and Fulfill
```php
use Shopify\Clients\Rest;

$client = new Rest($shopDomain, $accessToken);

// 1. Get fulfillment orders
$foResponse = $client->get("orders/{$shopifyOrderId}/fulfillment_orders");
$fulfillmentOrders = $foResponse->getDecodedBody()['fulfillment_orders'];

$openFO = null;
foreach ($fulfillmentOrders as $fo) {
    if ($fo['status'] === 'open') {
        $openFO = $fo;
        break;
    }
}

if (!$openFO) {
    throw new \Exception("No open fulfillment order found for Order {$shopifyOrderId}");
}

// 2. Submit fulfillment
$fulfillmentItems = [];
foreach ($openFO['line_items'] as $item) {
    if ($item['fulfillable_quantity'] > 0) {
        $fulfillmentItems[] = [
            'id' => $item['id'],
            'quantity' => $item['fulfillable_quantity']
        ];
    }
}

$response = $client->post(
    path: 'fulfillments',
    body: [
        'fulfillment' => [
            'tracking_info' => [
                'number' => '1Z999AA10123456784',
                'company' => 'UPS'
            ],
            'line_items_by_fulfillment_order' => [
                [
                    'fulfillment_order_id' => $openFO['id'],
                    'fulfillment_order_line_items' => $fulfillmentItems
                ]
            ]
        ]
    ]
);
```

## Local Repo Anchors

- `app/Marketplaces/Services/Orders/ShopifyOrderService.php`
- `app/Marketplaces/Services/Fulfillment/ShopifyFulfillmentService.php`
- `app/Marketplaces/Mappers/ShopifyOrderMapper.php`
