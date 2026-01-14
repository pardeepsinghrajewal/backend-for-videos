const isEmpty = (txt) => {
    if (txt == null || txt == undefined || txt.trim() === "") {
        return true;
    } else {
        return false;
    }
};
const isNotValidEmail = (email) => {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export { isEmpty, isNotValidEmail };
