import React, { useEffect } from 'react';

const formatCurrency = (value) => {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return '';
  }

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const useCurrencyFormatter = (fieldName, formData, setFormData) => {
  useEffect(() => {
    const rawValue = formData[fieldName];
    const formattedFieldName = `${fieldName}Fmt`;

    if (
      rawValue !== undefined &&
      rawValue !== null &&
      String(rawValue).trim() !== ''
    ) {
      const currentFormattedValue = formData[formattedFieldName];
      const newFormattedValue = formatCurrency(rawValue);

      if (newFormattedValue !== currentFormattedValue) {
        setFormData((prev) => ({
          ...prev,
          [formattedFieldName]: newFormattedValue,
        }));
      }
    } else {
      if (formData[formattedFieldName] !== '') {
        setFormData((prev) => ({
          ...prev,
          [formattedFieldName]: '',
        }));
      }
    }
  }, [
    fieldName,
    formData[fieldName],
    formData[`${fieldName}Fmt`],
    setFormData,
  ]);
};
