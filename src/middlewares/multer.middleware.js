import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), "public/temp"));
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.substring(0, file.originalname.lastIndexOf("."));

        const fileExt = file.originalname.split(".").pop();

        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${fileName}-${uniqueSuffix}.${fileExt}`);
    },
});

export const upload = multer({ storage: storage });
