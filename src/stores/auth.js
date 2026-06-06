import { defineStore } from "pinia";
import api from "../services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
  }),

  actions: {
    async login(email, password) {
      const { data } = await api.post("/api/auth/login", { email, password });

      this.user = data.user;
      this.token = data.token;

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    },

    async register(username, email, password) {
      const { data } = await api.post("/api/auth/register", {
        username,
        email,
        password,
      });

      this.user = data.user;
      this.token = data.token;

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});