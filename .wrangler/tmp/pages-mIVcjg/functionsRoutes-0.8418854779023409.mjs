import { onRequestDelete as __api_memos_js_onRequestDelete } from "C:\\Users\\yourw\\Documents\\Antigravity\\memo\\functions\\api\\memos.js"
import { onRequestGet as __api_memos_js_onRequestGet } from "C:\\Users\\yourw\\Documents\\Antigravity\\memo\\functions\\api\\memos.js"
import { onRequestPost as __api_memos_js_onRequestPost } from "C:\\Users\\yourw\\Documents\\Antigravity\\memo\\functions\\api\\memos.js"
import { onRequestPut as __api_memos_js_onRequestPut } from "C:\\Users\\yourw\\Documents\\Antigravity\\memo\\functions\\api\\memos.js"

export const routes = [
    {
      routePath: "/api/memos",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_memos_js_onRequestDelete],
    },
  {
      routePath: "/api/memos",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_memos_js_onRequestGet],
    },
  {
      routePath: "/api/memos",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_memos_js_onRequestPost],
    },
  {
      routePath: "/api/memos",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_memos_js_onRequestPut],
    },
  ]