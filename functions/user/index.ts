import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";

const contentTypeHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const getUsers = async (supabase: SupabaseClient) => {
  const { data: products, error } = await supabase.from("user").select("*");

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  return new Response(JSON.stringify({ response: products }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

const getUser = async (supabase: SupabaseClient, id: string) => {
  const { data: product, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", id);

  if (error) {
    console.log(error);

    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  return new Response(JSON.stringify({ response: product[0] }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

const postUser = async (supabase: SupabaseClient, user: { name: string }) => {
  const { data, error } = await supabase.from("user").insert([user]).select();

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  return new Response(JSON.stringify({ response: data[0] }), {
    headers: contentTypeHeaders,
    status: 200,
  });
};

Deno.serve(async (req) => {
  const { method } = req;

  if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (method !== "GET" && method !== "POST") {
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

    const userPattern = new URLPattern({ pathname: "/user/:id" });
    const matchingPath = userPattern.exec(req.url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;

    if (method === "GET" && typeof id !== "string") {
      return getUsers(supabaseClient);
    }

    if (method === "GET" && typeof id === "string") {
      return getUser(supabaseClient, id);
    }

    const product = await req.json();

    return postUser(supabaseClient, product);
  } catch (e) {
    console.error(e);

    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
