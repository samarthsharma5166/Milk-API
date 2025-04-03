import { Response } from "express";
import prisma from "../DB/Db";
import { AuthRequest } from "../types/types";
import axios from "axios";


export async function createZone(req:AuthRequest, res:Response) {
  const { name, pincodes ,city ,state } = req.body;
  console.log(name,pincodes[0],city,state)
   let coordinates = "";

   const fullAddress = ` ${city}, ${state}, ${pincodes[0]}`;
   const locationIQKey = process.env.LOCATION_IQ;
   try {
     const geoRes = await axios.get(`https://us1.locationiq.com/v1/search`, {
       params: {
         key: locationIQKey,
         q: fullAddress,
         format: "json",
       },
     });

     if (geoRes.data && geoRes.data.length > 0) {
       const { lat, lon } = geoRes.data[0];
       coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
     } else {
       res.status(400).json({
         success: false,
         message: "Invalid address. Could not fetch coordinates.",
       });
     }
   } catch (geoError) {
     console.error("Geocoding Error:", geoError);
     res.status(400).json({
       success: false,
       message: "Invalid address. Could not fetch coordinates.",
     });
     return;
   }

  try {
    const newZone = await prisma.zone.create({
      data: {
        name,
        pincodes,
        coordinates,
        city,
        state
      },
    });
    res.status(201).json({
      success: true,
      message: "Zone created successfully",
      newZone
    });
    return
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Something went wrong" });
     return;
  }
}


export async function getAllZones(req:AuthRequest, res:Response) {
  try {
    const zones = await prisma.zone.findMany();
    console.log(zones)
     res.status(200).json({
       success: true,
       message: "Zones fetched successfully",
       zones
     });
     return
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Something went wrong" });
     return
  }
}


export async function updateZone(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, pincodes, coordinates } = req.body;

  try {
    const updatedZone = await prisma.zone.update({
      where: { id },
      data: {
        name,
        pincodes,
        coordinates,
      },
    });
     res.status(200).json(updatedZone);
     return;
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Something went wrong" });
     return;
  }
}


export async function deleteZone(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const deliveryPerson = await prisma.deliveryPerson.updateMany({
      where: { zoneId: id },
      data: {
        zoneId: null,
        zoneCoordinates: null
      },
    })
    const deletedZone = await prisma.zone.delete({
      where: { id },
    });
     res
      .status(200)
      .json({ message: "Zone deleted successfully", deletedZone });
      return;
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Something went wrong" });
     return;
  }
}

export async function assignUpdateZone(req: AuthRequest, res: Response) {
  const { zoneId, deliveryPersonId } = req.params;
  console.log(zoneId,deliveryPersonId)
  try {
    const zoneCoordinates = await prisma.zone.findUnique({
      where: { id: zoneId },
      select: { coordinates: true },
    })
    if(!zoneCoordinates){
      res.status(404).json({
        success: false,
        message: "Zone not found",
      });
      return;
    }
    const updatedDelivery = await prisma.deliveryPerson.update({
      where: { id:deliveryPersonId },
      data: {
        zoneId: zoneId,
        zoneCoordinates: zoneCoordinates.coordinates
      },
    });
    console.log(updatedDelivery);
     res.status(200).json({
       success: true,
       message: "Zone assigned successfully",
       updateDeliveryPerson:{...updatedDelivery}
     });
     return;
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Something went wrong" });
     return;
  }
}

