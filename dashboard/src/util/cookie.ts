import Cookies from "js-cookie";

export const createCookie = (name: string, value: string, options: Cookies.CookieAttributes) => {
    Cookies.set(name, value, options);
}

export const getCookie = (name: string) => {
    return Cookies.get(name);
}

export const deleteCookie = (name: string) => {
    Cookies.remove(name);
}
