class ApiResponse {
    constructor(success = true, message = "success", data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

export { ApiResponse };
