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

const isPositiveInteger = (value) => {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1) {
        return false;
    }
    return true;
};

export { isEmpty, isNotValidEmail, isPositiveInteger };
