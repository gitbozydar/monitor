const getPrice = async ({ shop, tag, name }) => {
  try {
    // Make a request with custom headers
    const { data } = await axios.get(shop, { headers });

    // Load the page HTML into cheerio
    const $ = cheerio.load(data);

    // Extract the price using the provided CSS selector
    const price = $(tag).first().text();

    // Log the name and price of the product
    console.log(name, price);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Run the script with one of the products (e.g., Euro)
getPrice(products[2]);
