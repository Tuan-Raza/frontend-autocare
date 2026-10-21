const carImages = {
    honda: require("../../assets/cars/honda/honda.png"),
    toyota: require("../../assets/cars/toyota/toyota.png"),
    mazda: require("../../assets/cars/mazda/mazda.png"),
    suzuki: require("../../assets/cars/suzuki/suzuki.png"),
    mitsubishi: require("../../assets/cars/mitsubishi/mitsubishi.png"),
};

/**
 * Mengambil gambar mobil berdasarkan merek.
 * Mendukung pencocokan case-insensitive dan partial match (misal: "Honda Civic" -> honda.png).
 *
 * @param {string} merek - Merek kendaraan
 * @returns {any} Image source require
 */
export const getCarImage = (merek) => {
    if (!merek) {
        return require("../../assets/cars/default-car.png");
    }

    const key = String(merek).trim().toLowerCase();

    // 1. Direct match (e.g. "mazda")
    if (carImages[key]) {
        return carImages[key];
    }

    // 2. Partial match (e.g. "mazda 3" atau "toyota avanza")
    for (const brand of Object.keys(carImages)) {
        if (key.includes(brand)) {
            return carImages[brand];
        }
    }

    // 3. Fallback default
    return require("../../assets/cars/default-car.png");
};