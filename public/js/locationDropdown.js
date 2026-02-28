document.addEventListener("DOMContentLoaded", async () => {
  console.log("locationDropdown.js loaded ✅");

  const regionEl = document.getElementById("region");
  const provinceEl = document.getElementById("province");
  const cityMunEl = document.getElementById("cityMunicipality");

  if (!regionEl || !provinceEl || !cityMunEl) {
    console.error("Missing select elements. Check IDs: region, province, cityMunicipality");
    return;
  }

  const fill = (el, items, placeholder) => {
    el.innerHTML = `<option value="">${placeholder}</option>`;
    (items || []).forEach(x => {
      const opt = document.createElement("option");
      opt.value = x.code;
      opt.textContent = x.name;
      el.appendChild(opt);
    });
  };

  const fetchJson = async (url) => {
    const res = await fetch(url);
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${url}\n${text.slice(0, 200)}`);
    }
    if (!ct.includes("application/json")) {
      throw new Error(`Expected JSON, got ${ct}\n${text.slice(0, 200)}`);
    }
    return JSON.parse(text);
  };

  // Load regions
  try {
    const regions = await fetchJson("/api/locations/regions");
    console.log("regions:", regions.length);

    fill(regionEl, regions, "Select region");
    fill(provinceEl, [], "Select province");
    fill(cityMunEl, [], "Select city/municipality");

    provinceEl.disabled = true;
    cityMunEl.disabled = true;
  } catch (err) {
    console.error("Failed to load regions", err);
    return;
  }

  // Region -> Provinces (or Region -> Cities/Municipalities for NCR)
  regionEl.addEventListener("change", async () => {
    const regionCode = regionEl.value;
    console.log("Region changed to:", regionCode);

    fill(provinceEl, [], "Select province");
    fill(cityMunEl, [], "Select city/municipality");
    provinceEl.disabled = true;
    cityMunEl.disabled = true;

    if (!regionCode) return;

    try {
      const provinces = await fetchJson(`/api/locations/provinces?regionCode=${encodeURIComponent(regionCode)}`);
      console.log("provinces:", provinces.length);

      if (provinces.length === 0) {
        // ✅ NCR / no-province regions: load cities/municipalities directly under region
        const cities = await fetchJson(
          `/api/locations/cities-municipalities-by-region?regionCode=${encodeURIComponent(regionCode)}`
        );
        console.log("cities/municipalities (by region):", cities.length);

        fill(cityMunEl, cities, "Select city/municipality");
        cityMunEl.disabled = false;
        return;
      }

      fill(provinceEl, provinces, "Select province");
      provinceEl.disabled = false;

    } catch (err) {
      console.error("Failed to load provinces/cities for region", err);
    }
  });

  // Province -> Cities/Municipalities
  provinceEl.addEventListener("change", async () => {
    const provinceCode = provinceEl.value;

    fill(cityMunEl, [], "Select city/municipality");
    cityMunEl.disabled = true;

    if (!provinceCode) return;

    try {
      const cities = await fetchJson(`/api/locations/cities-municipalities?provinceCode=${encodeURIComponent(provinceCode)}`);
      console.log("cities/municipalities (by province):", cities.length);

      fill(cityMunEl, cities, "Select city/municipality");
      cityMunEl.disabled = false;
    } catch (err) {
      console.error("Failed to load cities/municipalities by province", err);
    }
  });

  const regionSelect = document.getElementById("region");
const provinceSelect = document.getElementById("province");
const citySelect = document.getElementById("cityMunicipality");

const regionNameInput = document.getElementById("region_name");
const provinceNameInput = document.getElementById("province_name");
const cityNameInput = document.getElementById("city_municipality_name");

// When region changes
regionSelect.addEventListener("change", function () {
  const selectedText = this.options[this.selectedIndex].text;
  regionNameInput.value = selectedText;
});

// When province changes
provinceSelect.addEventListener("change", function () {
  const selectedText = this.options[this.selectedIndex].text;
  provinceNameInput.value = selectedText;
});

// When city changes
citySelect.addEventListener("change", function () {
  const selectedText = this.options[this.selectedIndex].text;
  cityNameInput.value = selectedText;
});

  
});