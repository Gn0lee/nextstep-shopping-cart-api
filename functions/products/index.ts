import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";

const contentTypeHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const getProducts = async (supabase: SupabaseClient) => {
  const { data: products, error } = await supabase.from("products").select("*");

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

const getProductsPagination = async (
  supabase: SupabaseClient,
  page: string | null,
  pageSize: string | null
) => {
  const pageInt = parseInt(page ?? "0", 10);

  const pageSizeInt = parseInt(pageSize ?? "12", 10);

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact" });

  if (count === null || count === 0) {
    return new Response(
      JSON.stringify({
        response: {
          content: [],
          totalElements: 0,
          totalPages: 1,
        },
      }),
      {
        headers: contentTypeHeaders,
        status: 200,
      }
    );
  }

  const totalPages = Math.ceil(count / pageSizeInt);

  const startIndex = pageInt * pageSizeInt;

  const endIndex = startIndex + pageSizeInt - 1;

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .range(startIndex, endIndex);

  if (error) {
    return new Response(JSON.stringify({ code: error.code }), {
      headers: contentTypeHeaders,
      status: 500,
    });
  }

  const nextPageParam = pageInt + 1 < totalPages ? pageInt + 1 : undefined;
  const previousPageParam = pageInt > 0 ? pageInt - 1 : undefined;

  return new Response(
    JSON.stringify({
      response: {
        content: products,
        totalElements: count,
        totalPages,
        nextPageParam,
        previousPageParam,
      },
    }),
    {
      headers: contentTypeHeaders,
      status: 200,
    }
  );
};

const getProduct = async (supabase: SupabaseClient, id: string) => {
  const { data: product, error } = await supabase
    .from("products")
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

const postProduct = async (
  supabase: SupabaseClient,
  product: { name: string; imageUrl: string; price: number }
) => {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select();

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

    const url = new URL(req.url);

    const productPattern = new URLPattern({ pathname: "/products/:id" });
    const matchingPath = productPattern.exec(url.href);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;

    const queryParams = url.searchParams;

    const page = queryParams.get("page");

    const pageSize = queryParams.get("pageSize");

    if (method === "GET" && typeof id !== "string" && page === null) {
      return getProducts(supabaseClient);
    }

    if (method === "GET" && typeof id !== "string" && page !== null) {
      return getProductsPagination(supabaseClient, page, pageSize);
    }

    if (method === "GET" && typeof id === "string") {
      return getProduct(supabaseClient, id);
    }

    const product = await req.json();

    return postProduct(supabaseClient, product);
  } catch (e) {
    console.error(e);

    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
