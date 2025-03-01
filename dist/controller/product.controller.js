"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.getProducts = getProducts;
exports.getProductsById = getProductsById;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.searchProducts = searchProducts;
const userSchemas_1 = require("../Schema/userSchemas");
const Db_1 = __importDefault(require("../DB/Db"));
function createProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(req.body);
            const validateProductData = userSchemas_1.ProductDataSchema.safeParse(Object.assign(Object.assign({}, req.body), { minQuantity: Number(req.body.minQuantity), maxQuantity: Number(req.body.maxQuantity), discount: req.body.discount ? parseFloat(req.body.discount) : undefined, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, stockQuantity: Number(req.body.stockQuantity) }));
            if (!validateProductData.success) {
                console.log(validateProductData.error);
                res.status(400).json({
                    success: false,
                    message: "Enter valid data",
                    error: validateProductData.error.format(),
                });
                return;
            }
            const product = yield Db_1.default.product.create({
                data: Object.assign({}, validateProductData.data),
            });
            res.status(200).json({
                success: true,
                message: "Product created successfully",
                data: product,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Something went wrong",
                // @ts-ignore
                error: error === null || error === void 0 ? void 0 : error.message,
            });
        }
    });
}
// GET /api/products/get?page=1&limit=6
function getProducts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('reqest in get product');
        try {
            console.log(req.query);
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const pageNumber = page ? page : 1;
            const limitNumber = limit ? limit : 10;
            const skip = (pageNumber - 1) * limitNumber;
            const product = yield Db_1.default.product.findMany({
                skip,
                take: limitNumber,
                orderBy: {
                    createdAt: "desc",
                },
            });
            console.log(product);
            const totalProduct = yield Db_1.default.product.count();
            console.log(totalProduct);
            const hashMore = skip + (yield product).length < totalProduct;
            console.log(hashMore);
            console.log(' sending response');
            res.status(200).json({
                success: true,
                message: "products fetched successfully",
                data: product,
                hashMore
            });
            return;
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "something went wrong",
                error,
            });
            return;
        }
    });
}
function getProductsById(req, res, next) {
    try {
        const id = req.params.id;
        Db_1.default.product
            .findUnique({
            where: {
                id,
            },
        })
            .then((data) => {
            res.status(200).json({
                success: true,
                message: "product fetched successfully",
                data,
            });
        })
            .catch((error) => {
            res.status(500).json({
                success: false,
                message: "something went wrong",
                error,
            });
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong",
            error,
        });
    }
}
function updateProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(req.body);
            const { id } = req.params;
            const validateProductData = userSchemas_1.UpdateProductDataSchema.safeParse(Object.assign(Object.assign({}, req.body), { minQuantity: Number(req.body.minQuantity), maxQuantity: Number(req.body.maxQuantity), discount: req.body.discount
                    ? parseFloat(req.body.discount)
                    : undefined, startDate: req.body.startDate
                    ? new Date(req.body.startDate)
                    : undefined, stockQuantity: Number(req.body.stockQuantity) }));
            if (!validateProductData.success) {
                console.log(validateProductData.error);
                res.status(400).json({
                    success: false,
                    message: "Enter valid data",
                    error: validateProductData.error.format(),
                });
                return;
            }
            const existingProduct = yield Db_1.default.product.findUnique({
                where: {
                    id,
                },
            });
            if (!existingProduct) {
                res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
                return;
            }
            const data = yield Db_1.default.product.update({
                where: {
                    id,
                },
                data: Object.assign(Object.assign({}, validateProductData.data), { updatedAt: new Date() })
            });
            res.status(200).json({
                success: true,
                message: "product updated successfully",
                data,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "something went wrong",
                error,
            });
        }
    });
}
function deleteProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params; // Extract product ID from URL params
            // Check if the product exists
            const existingProduct = yield Db_1.default.product.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
                return;
            }
            // Delete the product
            yield Db_1.default.product.delete({ where: { id } });
            res.status(200).json({
                success: true,
                message: "Product deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Something went wrong",
                error: error === null || error === void 0 ? void 0 : error.message,
            });
        }
    });
}
// /api/products/search?query=milk&page=2&limit=10
function searchProducts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query } = req.query;
        console.log(query);
        if (!query) {
            res.status(400).json({
                success: false,
                message: "Invalid request",
            });
            return;
        }
        try {
            const products = yield Db_1.default.product.findMany({
                where: {
                    OR: [
                        { title: { contains: query.toString(), mode: "insensitive" } },
                        { description: { contains: query.toString(), mode: "insensitive" } },
                        { category: { contains: query.toString(), mode: "insensitive" } },
                    ],
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            res.status(200).json({
                success: true,
                message: "Products fetched successfully",
                data: products,
            });
        }
        catch (error) {
            console.error("Error searching products:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    });
}
;
