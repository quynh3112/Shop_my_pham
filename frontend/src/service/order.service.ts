import { api } from "../config/api";
import type { OrderCreate, OrderListQuery, OrderStatus } from "../types/order";

const endpoint = "/order";

export const createOrder = async (payload: OrderCreate) => {
    const token = localStorage.getItem("token");
    const res = await api.post(endpoint, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

export const listMyOrders = async (query: OrderListQuery = {}) => {
    const token = localStorage.getItem("token");
    const res = await api.get(`${endpoint}/my`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: query,
    });
    return res.data;
};

export const getMyOrder = async (code: string) => {
    const token = localStorage.getItem("token");
    const res = await api.get(`${endpoint}/my/${code}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

export const cancelMyOrder = async (code: string) => {
    const token = localStorage.getItem("token");
    const res = await api.post(`${endpoint}/my/${code}/cancel`, null, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

export const confirmMyOrder = async (id: number, body: OrderStatus) => {
    const token = localStorage.getItem("token");
    const res = await api.post(`${endpoint}/admin/${id}/confirm`, body, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
