import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";

const contentTypeHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const getCartList = async (supabase: SupabaseClient, uid: string) => {
  const { data: cart, error } = await supabase
    .from("cart")
    .select(
      `
      id,
      product:productId (
        id,
        name,
        price,
        imageUrl
      )
    `
    )
    .eq("userId", uid);

  if (error) throw error;

  return new Response(JSON.stringify({ response: cart }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

const postCart = async (
  supabase: SupabaseClient,
  product: { id: string },
  userId: string
) => {
  const { data, error } = await supabase
    .from("cart")
    .select("id,productId")
    .eq("userId", userId)
    .eq("productId", product.id)
    .maybeSingle();

  if (data) {
    return new Response(JSON.stringify({ response: data }), {
      headers: contentTypeHeaders,
      status: 200,
    });
  }

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  const { data: insertData, error: insertError } = await supabase
    .from("cart")
    .insert([{ userId, productId: product.id }]);

  if (insertError) {
    return new Response(JSON.stringify({ code: insertError.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  return new Response(JSON.stringify({ response: insertData }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

const deleteCart = async (supabase: SupabaseClient, id: string) => {
  const { error } = await supabase.from("cart").delete().eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  return new Response(JSON.stringify({ response: { success: true } }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

const deleteCarts = async (supabase: SupabaseClient, ids: string[]) => {
  const { error } = await supabase.from("cart").delete().in("id", ids);

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

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

  if (
    method !== "GET" &&
    method !== "POST" &&
    method !== "DELETE" &&
    method !== "PUT"
  ) {
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

    if (method === "DELETE") {
      const cartPattern = new URLPattern({ pathname: "/carts/:id" });
      const matchingPath = cartPattern.exec(req.url);
      const id = matchingPath ? matchingPath.pathname.groups.id : null;

      return deleteCart(supabaseClient, id || "");
    }

    if (method === "POST") {
      const { product } = await req.json();

      return postCart(supabaseClient, product, userId);
    }

    if (method === "PUT") {
      const { ids } = await req.json();

      return deleteCarts(supabaseClient, ids);
    }

    return getCartList(supabaseClient, userId);
  } catch (e) {
    console.log(e.message);

    return new Response(JSON.stringify({ message: e.message }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }
});
