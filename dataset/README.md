# EV Research Dataset

## Directory Structure

```
dataset/
├── data/                           # Structured data (CSV, ready to use)
│   ├── global_ev_outlook/          # IEA Global EV Outlook 2025 data
│   ├── market_sales/               # EV sales, market share, population data
│   ├── tco_analysis/               # Total Cost of Ownership calculations
│   ├── charging_infrastructure/    # Charging station data by country
│   ├── battery/                    # Battery price & capacity data
│   └── environment/                # CO2 emissions, energy substitution data
│
├── papers/                         # Academic papers (fulltext .txt)
│   ├── tco/                        # TCO-focused papers
│   ├── ev_adoption_policy/         # EV adoption & charging policy papers
│   ├── energy_systems/             # Energy systems & grid integration
│   ├── ev_market_industry/         # EV market & industry analysis
│   └── reports/                    # Institutional reports (IEA etc.)
│
└── references/                     # Bibliography files & citation references
```

---

## data/ — Structured Datasets

### global_ev_outlook/ — IEA Global EV Outlook 2025
| File | Description | Rows |
|------|-------------|------|
| `GEVO_EV_2025_main.csv` | Master dataset: EV stock/sales by region, mode, powertrain, year | 16,437 |
| `EV_sales_by_country.csv` | EV sales breakdown by country | 63 |
| `EV_sales_by_macro_region.csv` | EV sales by macro region | 12 |
| `other_parameters.csv` | Parameters other than sales and stock | 12 |
| `regions_countries_reference.csv` | Region/country mapping reference | 9 |
| `notes.csv` | Data source notes | ~1 |

### market_sales/ — EV Market & Sales
| File | Description | Rows |
|------|-------------|------|
| `us_wa_ev_population_data.csv` | Washington State EV population (VIN-level) | 150,482 |
| `global_ev_market_2026.csv` | Global EV market & charging infra 2026 (synthetic) | 5,000 |
| `global_ev_vs_petrol_comparison.csv` | EV vs petrol sales by country/region/year | 1,200 |
| `china_bev_penetration_rate.csv` | China BEV monthly penetration rate | 105 |
| `china_ratio_of_sales.csv` | China NEV/BEV/PHEV sales ratios | 5 |
| `china_annual_comparison.csv` | China annual sales comparison | 8 |
| `china_class_summary.csv` | China vehicle class sales summary | 56 |
| `china_automakers.csv` | China automaker data | 13 |
| `china_driving_range.csv` | China vehicle driving range data | 28 |
| `owid_ev_sales_share.csv` | EV sales share by country (Our World in Data) | — |
| `owid_bev_share_of_new_ev.csv` | BEV share of new EVs by country (OWID) | — |
| `owid_plugin_bev_sales_share.csv` | Plugin/BEV sales share by country (OWID) | — |

### tco_analysis/ — Total Cost of Ownership
| File | Description |
|------|-------------|
| `vehicle_class_definition.csv` | A00/A/B/C class definitions |
| `tco_summary_all_classes.csv` | TCO summary across all classes |
| `specs_A00_class.csv` / `specs_A_class.csv` / `specs_B_class.csv` / `specs_C_class.csv` | Vehicle specifications by class |
| `tco_A00_annual_*.csv` | A00 class TCO at 10k–300k km/year |
| `tco_A_inner_city_*.csv` | A class inner-city TCO at 20k–80k km/year |
| `tco_A_shared_riding_300k_km.csv` | A class shared riding TCO |
| `tco_B_annual_*.csv` | B class TCO at 20k–300k km/year |
| `tco_C_annual_*.csv` | C class TCO at 20k–300k km/year |
| `comparison_*_class.csv` | BEV vs ICEV comparison by class |
| `tco_*_2sd.csv` | B class with 2-standard-deviation sensitivity |

### charging_infrastructure/ — Charging Stations
| File | Description |
|------|-------------|
| `china_charging_stations.csv` | China charging station data |
| `norway_charging_stations.csv` | Norway charging station data |
| `sweden_charging_stations.csv` | Sweden charging station data |
| `netherlands_charging_stations.csv` | Netherlands charging station data |
| `germany_charging_stations.csv` | Germany charging station data |

### battery/ — Battery Data
| File | Description |
|------|-------------|
| `battery_price.csv` | Battery price over time (paper data) |
| `battery_installed_capacity.csv` | Battery installed capacity |
| `owid_lithium_ion_battery_cell_price.csv` | Li-ion cell price history 1991– (OWID) |

### environment/ — Environmental Data
| File | Description |
|------|-------------|
| `owid_co2_emissions_by_fuel.csv` | CO2 emissions by fuel type (OWID) |
| `owid_global_energy_substitution.csv` | Global energy substitution history (OWID) |
| `owid_lead_petrol_ban.csv` | Lead petrol ban timeline by country (OWID) |

---

## papers/ — Academic Papers

Each paper folder contains `fulltext.txt` and optionally `reference.bib` or `reference.ris`.

### tco/ — Total Cost of Ownership
| Folder | Paper | Year | Source |
|--------|-------|------|--------|
| `Woody_2026_Used_Vehicle_TCO/` | Total cost of ownership of electric and gasoline used vehicles | 2026 | Environ. Res. Lett. |
| `BEUC_2025_TCO_Study/` | BEUC TCO Study — Automotive Dialogue Technical Report | 2025 | BEUC |
| `Noll_2026_BEVs_Africa_TCO/` | Battery-electric passenger vehicles will be cost-effective across Africa | 2026 | Nature Energy |
| `Baek_2026_IEEE_TCO_Electrification/` | TCO of vehicle electrification and fuel switching options | 2026 | IEEE / eTransportation |
| `paper_126008174/` | Short TCO-related paper | — | — |

### ev_adoption_policy/ — EV Adoption & Policy
| Folder | Paper | Year | Source |
|--------|-------|------|--------|
| `Charging_Infra_Incentives_US/` | The Role of Charging Infrastructure and Incentives on EV Adoption in the US | — | — |
| `s41467_Nature_Comms/` | Nature Communications EV paper | 2024 | Nature Communications |

### energy_systems/ — Energy Systems & Grid
| Folder | Paper | Year | Source |
|--------|-------|------|--------|
| `2026_Closed_Loop_EV_Demand_Response/` | Closed-loop corrective EV demand response | 2026 | Renewable Energy |
| `2026_Coordinated_Multi_Vector_Dispatch/` | Coordinated dispatch of electric/thermal/hydrogen | 2026 | Renewable Energy |
| `2026_Multi_Energy_Storage_Capacity/` | Optimal multi-energy storage capacity allocation | 2026 | Renewable Energy |
| `2026_Complementary_Hydro_Wind_PV_Scheduling/` | Complementary scheduling of hydro-wind-PV-storage | 2026 | Renewable Energy |
| `2026_Emissions_Transition_Structure/` | Evolving structure of emissions in transition | 2026 | J. Cleaner Production |

### ev_market_industry/ — Market & Industry
| Folder | Paper | Year | Source |
|--------|-------|------|--------|
| `2026_Cost_Benefit_Rail_Vehicle/` | Cost-benefit analysis for new rail vehicle | 2026 | Transportation Research |

### reports/ — Institutional Reports
| Folder | Report | Year | Source |
|--------|--------|------|--------|
| `IEA_2025_Global_EV_Outlook/` | Global EV Outlook 2025 Policy Explorer | 2025 | IEA |

---

## references/ — Bibliography & Citations

| File | Description |
|------|-------------|
| `Related_work.md` | OWID data source citations (bib format) |
| `Woody_2026_IOP.bib` | Woody et al. 2026 citation |
| `Baek_2026_etran_TCO.bib` | Baek et al. 2026 eTransportation TCO citation |
| `Noll_2026_Nature_Energy.ris` | Noll et al. 2026 Nature Energy citation |
| `GNSS_Ionospheric_Delay.bib` | Unrelated reference (GNSS/ionospheric delay study) |
