import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";

const contentTypeHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const getOrderList = async (supabase: SupabaseClient, uid: string) => {
  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      id,
      isPaid,
      orderDetails (
        quantity,
        products (
          id,
          name,
          price,
          imageUrl
        )
      )
    `
    )
    .eq("userId", uid);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      response: orders.map((order) => ({
        ...order,
        orderDetails: order.orderDetails.map((detail) => ({
          ...detail.products,
          quantity: detail.quantity,
        })),
      })),
    }),
    {
      headers: contentTypeHeaders,
      status: 200,
    }
  );
};

const getOrder = async (
  supabase: SupabaseClient,
  orderId: string,
  uid: string
) => {
  const { data: order, error } = await supabase
    .from("order")
    .select(
      `
      id,
      isPaid,
      orderDetails (
        quantity,
        products (
          id,
          name,
          price,
          imageUrl
        )
      )
    `
    )
    .eq("userId", uid)
    .eq("id", orderId);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      response: {
        ...order[0],
        orderDetails: order[0].orderDetails.map((detail) => ({
          ...detail.products,
          quantity: detail.quantity,
        })),
      },
    }),
    {
      headers: contentTypeHeaders,
      status: 200,
    }
  );
};

const postOrder = async (
  supabase: SupabaseClient,
  orderDetails: { id: string; quantity: number }[],
  userId: string
) => {
  const { data: insertOrderData, error: insertOrderError } = await supabase
    .from("order")
    .insert([{ userId }])
    .select();

  if (insertOrderError) {
    return new Response(JSON.stringify({ code: insertOrderError.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  const { error: insertOrderDetailsError } = await supabase
    .from("orderDetails")
    .insert(
      orderDetails.map((el) => ({
        orderId: insertOrderData[0].id,
        productId: el.id,
        quantity: el.quantity,
      }))
    )
    .select();

  if (insertOrderDetailsError) {
    return new Response(
      JSON.stringify({ code: insertOrderDetailsError.code }),
      {
        headers: contentTypeHeaders,
        status: 500,
      }
    );
  }

  return new Response(
    JSON.stringify({
      response: {
        id: insertOrderData[0].id,
      },
    }),
    {
      headers: contentTypeHeaders,
      status: 200,
    }
  );
};

const putIsPaid = async (
  supabase: SupabaseClient,
  orderId: string,
  uid: string
) => {
  const { error } = await supabase
    .from("order")
    .update({ isPaid: true })
    .eq("id", orderId)
    .eq("userId", uid);

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  await supabase.from("cart").delete().eq("userId", uid);

  return new Response(JSON.stringify({ response: { success: true } }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

Deno.serve(async (req) => {
  const { method } = req;

  if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (method !== "GET" && method !== "POST" && method !== "PUT") {
    return new Response(JSON.stringify({ message: "Invalid method" }), {
      headers: contentTypeHeaders,
      status: 403,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    const userId = req.headers.get("uid");

    if (userId === null) {
      return new Response(JSON.stringify({ message: "No User" }), {
        headers: contentTypeHeaders,
        status: 403,
      });
    }

    if (method === "POST") {
      const { orderDetails } = await req.json();

      return postOrder(supabaseClient, orderDetails, userId);
    }

    if (method === "PUT") {
      const cartPattern = new URLPattern({ pathname: "/orders/:id" });
      const matchingPath = cartPattern.exec(req.url);
      const id = matchingPath ? matchingPath.pathname.groups.id : null;

      return putIsPaid(supabaseClient, id || "", userId);
    }

    const cartPattern = new URLPattern({ pathname: "/orders/:id" });
    const matchingPath = cartPattern.exec(req.url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;

    if (typeof id === "string") {
      return getOrder(supabaseClient, id, userId);
    }

    return getOrderList(supabaseClient, userId);
  } catch (e) {
    console.log(e.message);

    return new Response(JSON.stringify({ message: e.message }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }
});
