import { Autocomplete, TextField, Chip, Box, Typography } from "@mui/material";
import { Medication, searchMedications, formatMedicationDisplay } from "../../data/medications";
import { useState } from "react";

interface MedicationAutocompleteProps {
  category: "diabetes" | "hypertension";
  selectedMedications: string[];
  onChange: (medications: string[]) => void;
}

export default function MedicationAutocomplete({
  category,
  selectedMedications,
  onChange,
}: MedicationAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const medications = searchMedications(inputValue, category);

  const getMedicationOptions = () => {
    return medications.flatMap(med =>
      med.dosages.map(dosage => ({
        label: formatMedicationDisplay(med, dosage),
        value: formatMedicationDisplay(med, dosage),
        medication: med,
        dosage,
      }))
    );
  };

  const options = getMedicationOptions();

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        الأدوية الحالية
      </Typography>
      <Autocomplete
        multiple
        options={options}
        value={options.filter(opt => selectedMedications.includes(opt.value))}
        onChange={(_, newValue) => {
          onChange(newValue.map(v => v.value));
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="ابحث عن دواء..."
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              sx: { direction: "rtl" },
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={option.label}
              {...getTagProps({ index })}
              sx={{
                bgcolor: category === "diabetes" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                color: category === "diabetes" ? "#f59e0b" : "#ef4444",
              }}
            />
          ))
        }
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ direction: "rtl", display: "block" }}>
            <Typography variant="body2">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.medication.class}
            </Typography>
          </Box>
        )}
        noOptionsText="لا توجد نتائج"
        sx={{ direction: "rtl" }}
      />
    </Box>
  );
}
