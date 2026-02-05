import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",
    initialState:{
        loading:false,
        user:null,
        role:null
    },
    reducers:{
        // actions
        setLoading:(state, action) => {
            state.loading = action.payload;
        },
        setUser:(state, action) => {
            state.user = action.payload;
            state.role = action.payload?.role || null;
        },
        logout:(state) => {
            state.user = null;
            state.role = null;
        }
    }
});
export const {setLoading, setUser, logout} = authSlice.actions;
export default authSlice.reducer;