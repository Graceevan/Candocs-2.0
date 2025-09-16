import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = {
        userId: action.payload.userId,
        username: action.payload.username,
        email: action.payload.email,
        authToken: action.payload.authToken,
        refreshToken: action.payload.refreshToken,
        groups: action.payload.groups, // optional, can remove if not used
      };
      state.isAuthenticated = true; // ✅
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false; // ✅
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
