import { NextFunction,Response } from "express";
import { AuthRequest } from "../types/types";
import { ProductData, ProductDataSchema, UpdatedProductData, UpdateProductDataSchema } from "../Schema/userSchemas";
import { create } from "domain";
import prisma from "../DB/Db";
import { number } from "zod";

export async function createProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log(req.body);
    const validateProductData = ProductDataSchema.safeParse({
      ...req.body,
      minQuantity: Number(req.body.minQuantity),
      maxQuantity: Number(req.body.maxQuantity),
      discount: req.body.discount ? parseFloat(req.body.discount) : undefined,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      stockQuantity: Number(req.body.stockQuantity),
    });

    if (!validateProductData.success) {
      console.log(validateProductData.error)
       res.status(400).json({
        success: false,
        message: "Enter valid data",
        error: validateProductData.error.format(),
      });
      return;
    }

    console.log(validateProductData.data);``

    const product = await prisma.product.create({
      data: {
        ...validateProductData.data,
      },
    });

    res.status(200).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error?.message,
    });
  }
}

// GET /api/products/get?page=1&limit=6

export async function getProducts(req: AuthRequest, res: Response, next: NextFunction) {
  console.log('reqest in get product');
    try {
      console.log(req.query)
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const pageNumber = page ? page : 1;
        const limitNumber = limit ? limit : 10; 

        const skip = (pageNumber - 1) * limitNumber;
        const product = await prisma.product.findMany({
            skip,
            take: limitNumber,
            orderBy: {
                createdAt: "desc",
            },
        })
        
        console.log(product)
        const totalProduct = await prisma.product.count();
        console.log(totalProduct)
        const hashMore = skip + (await product).length < totalProduct;
        console.log(hashMore)
        console.log(' sending response')
        res.status(200).json({
            success: true,
            message: "products fetched successfully",
            data:product,
            hashMore
        });
        return 
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "something went wrong",
            error,
        });
        return
    }
}

export function getProductsById(req: AuthRequest,res: Response,next: NextFunction) {
    try {
            const id = req.params.id;
            prisma.product
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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong",
            error,
        });
    }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
         console.log("update product",req.body);
         const { id } = req.params;
         const validateProductData = UpdateProductDataSchema.safeParse({
           ...req.body,
           minQuantity: Number(req.body.minQuantity),
           maxQuantity: Number(req.body.maxQuantity),
           discount: req.body.discount
             ? parseFloat(req.body.discount)
             : undefined,
           startDate: req.body.startDate
             ? new Date(req.body.startDate)
             : undefined,
           stockQuantity: Number(req.body.stockQuantity),
         });

         if (!validateProductData.success) {
           console.log(validateProductData.error);
           res.status(400).json({
             success: false,
             message: "Enter valid data",
             error: validateProductData.error.format(),
           });
           return;
         }
        const existingProduct = await prisma.product.findUnique({
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
        console.log(validateProductData.data);
        const data = await prisma.product.update({
            where: {
              id,
            },
            data: {
                ...validateProductData.data,
                updatedAt: new Date(),
            }
          })
          
          console.log(data)
        res.status(200).json({
            success: true,
            message: "product updated successfully",
            data,
        });
    } catch (error) {
         res.status(500).json({
           success: false,
           message: "something went wrong",
           error,
         });
    }   
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // Extract product ID from URL params

      // Check if the product exists
      const existingProduct = await prisma.product.findUnique({
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
      await prisma.product.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: (error as { message: string })?.message,
      });
    }
}


// /api/products/search?query=milk&page=2&limit=10
export async function searchProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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
    const products = await prisma.product.findMany({
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
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};


