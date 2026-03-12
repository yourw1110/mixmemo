export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM memos ORDER BY displayOrder ASC"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const data = await request.json();

    // Handle batch update for reordering
    if (Array.isArray(data)) {
      const statements = data.map((memo, index) => {
        return env.DB.prepare(
          "UPDATE memos SET displayOrder = ? WHERE id = ?"
        ).bind(index, memo.id);
      });
      await env.DB.batch(statements);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle single create
    const { id, title, content, createdAt, updatedAt } = data;
    
    // Get max displayOrder
    const maxOrder = await env.DB.prepare("SELECT MAX(displayOrder) as maxOrder FROM memos").first("maxOrder") || 0;

    await env.DB.prepare(
      "INSERT INTO memos (id, title, content, createdAt, updatedAt, displayOrder) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, title, content, createdAt, updatedAt || createdAt, maxOrder + 1).run();

    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  try {
    const { id, title, content, updatedAt } = await request.json();
    await env.DB.prepare(
      "UPDATE memos SET title = ?, content = ?, updatedAt = ? WHERE id = ?"
    ).bind(title, content, updatedAt || Date.now(), id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  try {
    const { ids } = await request.json();
    const placeholders = ids.map(() => "?").join(",");
    await env.DB.prepare(
      `DELETE FROM memos WHERE id IN (${placeholders})`
    ).bind(...ids).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
