# NEXTSTEP SHOPPING CART API

## 소개

NEXTSTEP의 TDD, 클린코드 with REACT 3기의 장바구니 미션에서 사용하는 api 입니다.

Supabase를 이용하여 만든 간단한 api이니 자유롭게 사용하시고 DM이나 issue를 통해 문의 부탁드립니다.

## 정보

### API Endpoint

   `https://lgbbwcvwtbrudityxxbd.supabase.co/functions/v1`

### anon Key

    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYmJ3Y3Z3dGJydWRpdHl4eGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE0MzY5MzgsImV4cCI6MjAyNzAxMjkzOH0.V4nEgkFClH7OPi0glqZIQOtvpYkpirAcBGLCp8mJQiw


## 사용방법

1. Request Header의 Authorization 필드에 anon Key 주입

    ```typescript
    {
        "Autorization" : `Bearer ${anonKey}`
    }
    ```

2. user, products 이외의 api 요청에서 Request Header에 유저 id 주입

    유저 아이디는 `POST /user` 의 응답을 통해 알 수 있습니다.

    ```typescript
    {
        "uid" : `${userId}`
    }
    ```
   

## API 명세


1. `POST /user`
   - 유저를 생성한 하고 유저 id를 반환합니다.
   - request
    ```json
    {
      "name": "example"
    }
    ```
   - response
    ```json
    {
      "response": {
        "id": "70fac291-591b-44b2-84d8-0b4eea825c4d",
        "created_at": "2024-03-27T04:51:55.869577+00:00",
        "name": "example"
      }  
    }
    ```
   
2. `POST /products`
   - 상품을 생성합니다.
   - request
       ```json
       {
         "name" : "example",
         "price" : 2000,
         "imageUrl" : "image"
       }
       ```
   - response
     ```json
     {
       "response": {
         "id": "70fac291-591b-44b2-84d8-0b4eea825c4d",
         "name" : "example",
         "price" : 2000,
         "imageUrl" : "image"
       }  
     }
     ```
     

3. `GET /products`
    - 상품의 목록을 조회합니다. 
    - response
      ```json
      {
        "response": [
          {
              "id": "70fac291-591b-44b2-84d8-0b4eea825c4d",
              "name" : "example",
              "price" : 2000,
              "imageUrl" : "image"
          }
        ]  
      }
      ```
      
4. `GET /products/:id`
    - 상품의 id를 통해 상품의 정보를 조회합니다.
    - response
      ```json
      {
        "response": {
            "id": "70fac291-591b-44b2-84d8-0b4eea825c4d",
            "name" : "example",
            "price" : 2000,
            "imageUrl" : "image"
         }  
      }
      ```
      
    
5. `POST /cart`
    - 장바구니에 물품을 추가합니다.
    - 같은 물품을 추가하여도 row가 생성되지 않습니다.
    - request
        ```json
        {
          "product" : {
            "id": "70fac291-591b-44b2-84d8-0b4eea825c4d",
            "name" : "example",
            "price" : 2000,
            "imageUrl" : "image"
          } 
        }
        ```
    - response
      ```json
      {
        "response": {
          "success" : true
        }  
      }
      ```
      

6. `GET /carts`
    - 유저가 선택한 장바구니를 조회합니다.
    - response
      ```json
      {
        "response": [
          {   
              "id" : "cart id",
              "product" : {
                  "id": "product id",
                  "name" : "example",
                  "price" : 2000,
                  "imageUrl" : "image"
              }
          }
        ]  
      }
      ```
      

7. `DELETE /carts/:id`
    - 특정 장바구니를 삭제합니다.
    - response
      ```json
      {
        "response": {
            "success" : true
         }  
      }
      ```
      
8. `PUT /carts`
    - 여러개의 장바구니를 한번에 삭제합니다.
    - request
        ```json
        {
          "ids" : ["id1", "id2"]
        }
        ```
    - response
      ```json
      {
        "response": {
          "success" : true
        }  
      }
      ```
      

8. `POST /orders`
    - 주문을 생성합니다.
    - request
        ```json
        {
          "orderDetails" : [
              {
                  "id" : "productId",
                  "imageUrl": "image",
                  "name" : "name",
                  "price" : 2000,
                  "quantity" : 1
              }
              
            ]
        }
        ```
    - response
      ```json
      {
        "response": {
          "id" : "orderId"
        }  
      }
      ```


9. `GET /orders`
    - 사용자의 주문 목록을 조회합니다.
    - response
      ```json
      {
        "response": [
          {
              "id": "orderId",
              "isPaid": false,
              "orderDetails" : [
                  {
                    "id": "productId",
                    "name": "name",
                    "price": 83700,
                    "imageUrl": "image",
                    "quantity": 1
                 }
              ] 
          }
        ]  
      }
      ```

10. `GET /orders/:id`
    - 주문 id를 통해 한개의 주문을 조회합니다.
    - response
      ```json
      {
        "response": {
              "id": "orderId",
              "isPaid": false,
              "orderDetails" : [
                  {
                    "id": "productId",
                    "name": "name",
                    "price": 83700,
                    "imageUrl": "image",
                    "quantity": 1
                 }
              ] 
          }
      }
      ```
      

11. `PUT /orders/:id`
    - 특정 주문의 isPaid를 true로 업데이트 합니다. -> 주문/결제 페이지에서 결제시 호출하는 api
    - isPaid가 업데이트되면 사용자의 장바구니를 비웁니다.
    - response
      ```json
      {
        "response": {
          "success" : true
        }  
      }
      ```
      

## Data Type

### Product

```typescript
export interface Product {
	id: string;
	name: string;
	price: number;
	imageUrl: string;
}
```

### Cart

```typescript
import type { Product } from '...';

export interface CartItemData {
	id: string;
	product: Product;
}
```

### Order 

```typescript

import { Product } from '...';

export interface OrderDetail extends Product {
	quantity: number;
}

export interface Order {
	id: string;
	orderDetails: OrderDetail[];
	isPaid: boolean;
}

```
