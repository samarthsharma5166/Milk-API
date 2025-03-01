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
exports.createZone = createZone;
exports.getAllZones = getAllZones;
exports.updateZone = updateZone;
exports.deleteZone = deleteZone;
exports.assignUpdateZone = assignUpdateZone;
const Db_1 = __importDefault(require("../DB/Db"));
const axios_1 = __importDefault(require("axios"));
function createZone(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, pincodes, city, state } = req.body;
        console.log(name, pincodes[0], city, state);
        let coordinates = "";
        const fullAddress = ` ${city}, ${state}, ${pincodes[0]}`;
        const locationIQKey = process.env.LOCATION_IQ;
        try {
            const geoRes = yield axios_1.default.get(`https://us1.locationiq.com/v1/search`, {
                params: {
                    key: locationIQKey,
                    q: fullAddress,
                    format: "json",
                },
            });
            if (geoRes.data && geoRes.data.length > 0) {
                const { lat, lon } = geoRes.data[0];
                coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: "Invalid address. Could not fetch coordinates.",
                });
            }
        }
        catch (geoError) {
            console.error("Geocoding Error:", geoError);
            res.status(400).json({
                success: false,
                message: "Invalid address. Could not fetch coordinates.",
            });
            return;
        }
        try {
            const newZone = yield Db_1.default.zone.create({
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
            return;
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong" });
            return;
        }
    });
}
function getAllZones(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const zones = yield Db_1.default.zone.findMany();
            console.log(zones);
            res.status(200).json({
                success: true,
                message: "Zones fetched successfully",
                zones
            });
            return;
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong" });
            return;
        }
    });
}
function updateZone(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, pincodes, coordinates } = req.body;
        try {
            const updatedZone = yield Db_1.default.zone.update({
                where: { id },
                data: {
                    name,
                    pincodes,
                    coordinates,
                },
            });
            res.status(200).json(updatedZone);
            return;
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong" });
            return;
        }
    });
}
function deleteZone(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const deletedZone = yield Db_1.default.zone.delete({
                where: { id },
            });
            res
                .status(200)
                .json({ message: "Zone deleted successfully", deletedZone });
            return;
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong" });
            return;
        }
    });
}
function assignUpdateZone(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { zoneId, deliveryPersonId } = req.params;
        console.log(zoneId, deliveryPersonId);
        try {
            const zoneCoordinates = yield Db_1.default.zone.findUnique({
                where: { id: zoneId },
                select: { coordinates: true },
            });
            if (!zoneCoordinates) {
                res.status(404).json({
                    success: false,
                    message: "Zone not found",
                });
                return;
            }
            const updatedDelivery = yield Db_1.default.deliveryPerson.update({
                where: { id: deliveryPersonId },
                data: {
                    zoneId: zoneId,
                    zoneCoordinates: zoneCoordinates.coordinates
                },
            });
            console.log(updatedDelivery);
            res.status(200).json({
                success: true,
                message: "Zone assigned successfully",
                updateDeliveryPerson: Object.assign({}, updatedDelivery)
            });
            return;
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong" });
            return;
        }
    });
}
