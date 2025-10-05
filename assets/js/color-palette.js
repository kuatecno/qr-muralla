/**
 * QRMURALLA Product Card Color Palette
 *
 * Curated color combinations for product cards
 * Each palette includes background and text colors
 */

export const COLOR_PALETTE = [
  // Row 1
  { bg: "#735A5F", text: "#C8BEB4" }, // Mortar & Zanah
  { bg: "#32146E", text: "#64FF82" }, // Persian Indigo & Screamin' Green
  { bg: "#640096", text: "#F9C7CF" }, // Windsor & Moon Raker
  { bg: "#F5F0C8", text: "#0FFF50" }, // Tusk & Malachite

  // Row 2
  { bg: "#E6F5D2", text: "#5028C8" }, // Orinoco & Seance
  { bg: "#0FFF50", text: "#5A3250" }, // Harlequin & Finn
  { bg: "#64FFC8", text: "#5F2864" }, // Screamin' Green & Clairvoyant
  { bg: "#5A1E1E", text: "#D9D7CD" }, // Mahogany & Westar

  // Row 3
  { bg: "#433D5A", text: "#D7C8DC" }, // Martinique & Prelude
  { bg: "#E6C8BE", text: "#1E8C82" }, // Oyster Pink & Genoa
  { bg: "#2D3C3C", text: "#E1D2C8" }, // Outer Space & Almond
  { bg: "#DCDCC8", text: "#3737C8" }, // Zanah & Daisy Bush

  // Row 4
  { bg: "#5014C8", text: "#EBD7F5" }, // Persian Indigo & Mauve
  { bg: "#463732", text: "#FFFFFF" }, // Livid Brown & Ebb
  { bg: "#50596E", text: "#CEDCE6" }, // Oxford Blue & Lavender Gray
  { bg: "#32005A", text: "#B4FF64" }, // Jagger & Lima

  // Row 5
  { bg: "#2D3C3C", text: "#A0B4D2" }, // Outer Space & Blue Marguerite
  { bg: "#28285A", text: "#D7DCF0" }, // Jacksons Purple & Cold Turkey
  { bg: "#DCE6C8", text: "#640096" }, // Willow Brook & Purple
  { bg: "#2D3C3C", text: "#5AFFC8" }, // Outer Space & Shamrock

  // Row 6
  { bg: "#C8E6D2", text: "#665263" }, // Tusk & Mulled Wine
  { bg: "#C8D7F5", text: "#3737C8" }, // Moon Raker & Daisy Bush
  { bg: "#325AAF", text: "#F5DCCB" }, // Azure & Melanie

  // Row 7
  { bg: "#7D1400", text: "#F5D2C8" }, // Red Oxide & Chatelle
  { bg: "#DCBEF5", text: "#2D1450" }, // Biloba Flower & Dark Purple (fixed contrast)
  { bg: "#D7C8F5", text: "#0F5A5A" }, // Moon Raker & Atoll
  { bg: "#5F82D2", text: "#FFFAC8" }, // Danube & Coconut Cream

  // Row 8
  { bg: "#1400E6", text: "#C4F5D2" }, // Persian Blue & Madang
  { bg: "#D7C8E6", text: "#1400E6" }, // Melrose & Persian Blue
  { bg: "#E1C8D2", text: "#1E8C7D" }, // Maverick & Lochinvar
  { bg: "#E6D7E1", text: "#665A5F" }, // Twilight & Eggplant

  // Row 9
  { bg: "#FFFFC8", text: "#1E8C64" }, // Mimosa & Elf Green
  { bg: "#FFFAC8", text: "#7D3214" }, // Mint Julep & Totem Pole
  { bg: "#C8BED7", text: "#373750" }, // Chatelle & Valhalla

  // Row 10
  { bg: "#F5E1C8", text: "#665263" }, // Astra & Mulled Wine
  { bg: "#D4D4D8", text: "#28285A" }, // Mischka & Jacksons Purple
  { bg: "#780078", text: "#DCE6C8" }, // Cardinal Pink & Willow Brook
  { bg: "#640096", text: "#DCBEF5" }, // Clairvoyant & Biloba Flower
  { bg: "#7D1E14", text: "#D7C8DC" }, // Falu Red & Prelude
  { bg: "#E6D2DC", text: "#828C96" }, // Wafer & Smoky

  // Additional from previous screenshots
  { bg: "#D9D7CD", text: "#1A1469" }, // Westar & Deep Koamaru
  { bg: "#9B1B30", text: "#F9C7CF" }, // Monarch & Mauve
  { bg: "#533D5C", text: "#D4C4D8" }, // Voodoo & Light Wisteria
  { bg: "#CCFFD4", text: "#3D1D54" }, // Snowy Mint & Loulou
  { bg: "#DFE0C8", text: "#464D53" }, // Aths Special & Fiord
  { bg: "#434750", text: "#A4A8C1" }, // Mako & Ship Cove
  { bg: "#DDD6E8", text: "#665263" }, // Snuff & Mulled Wine
  { bg: "#E2EAC8", text: "#2828C8" }, // Chrome White & Blue Gem
  { bg: "#FAFFC8", text: "#5028C8" }, // Corn Field & Kingfisher Daisy
  { bg: "#DDD6E8", text: "#373750" }, // Snuff & Valhalla
  { bg: "#0000FF", text: "#C8DCFA" }, // Blue & Moon Mist
  { bg: "#463732", text: "#A0B4D2" }, // Livid Brown & Periglacial Blue
  { bg: "#463750", text: "#D2B4C8" }, // Livid Brown & Bizarre
  { bg: "#E6D7F5", text: "#32146E" }, // Twilight & Christalle
  { bg: "#B91C1C", text: "#FEF2F2" }, // Tamarillo & Light Pink
  { bg: "#4A4458", text: "#86EFAC" }, // Martinique & Light Green
  { bg: "#FEF3C7", text: "#4A4458" }, // Parchment & Dark Purple

  // New additions
  { bg: "#3D7EA6", text: "#D7F0FF" }, // Azure & Surf
  { bg: "#C8F5D2", text: "#3C5A4B" }, // Tea Green & Rhino
  { bg: "#6E5F6E", text: "#AFCDD7" }, // Salt Box & Blue Haze
  { bg: "#C8BEE6", text: "#3264A6" }, // Prelude & St Tropaz
];

/**
 * Get a color palette by index
 * @param {number} index - The index of the color palette
 * @returns {Object} Color palette with bg and text properties
 */
export function getColorPalette(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

/**
 * Get a random color palette
 * @returns {Object} Random color palette with bg and text properties
 */
export function getRandomColorPalette() {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[randomIndex];
}
