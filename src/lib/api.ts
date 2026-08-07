export const api = {
  posts: {
    getAll: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    create: async (data: { content: string; imageUrl?: string }) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    like: async (id: string) => {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to like post");
      return res.json();
    },
    view: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to view post");
      return res.json();
    },
  },
  comments: {
    getAll: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    create: async (postId: string, data: { content: string; side?: string; parentComment?: string }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    like: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to like comment");
      return res.json();
    },
    hide: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}/hide`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to hide comment");
      return res.json();
    },
  },
  auth: {
    google: async (credential: string) => {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) throw new Error("Failed to authenticate");
      return res.json();
    },
    logout: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to logout");
      return res.json();
    },
    me: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  },
  user: {
    onboarding: async (data: { handle: string; handleColor?: string }) => {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to complete onboarding");
      }
      return res.json();
    },
  },
  upload: {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      return res.json();
    },
  },
  hashtags: {
    search: async (query: string) => {
      const res = await fetch(`/api/hashtags/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch hashtags");
      return res.json();
    },
  },
  users: {
    search: async (query: string) => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  },
};

