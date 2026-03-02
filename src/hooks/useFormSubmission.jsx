import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { generatePDF } from '@/pdfGenerator';
import { sendToTelegram, formatTelegramMessage, formatTelegramMessageForBot2 } from '@/telegramService';
import { gerarCodigo, formatDataHora, formatData, sanitizeFilename } from '@/utils';
import { toast } from '@/components/ui/use-toast';
import { initialFormData } from '@/constants';

const uploadDocumentsToSupabase = async (documents, codigo_cadastro) => {
  if (!supabase || !Array.isArray(documents) || documents.length === 0) return [];
  
  const uploadedFilesInfo = [];
  
  for (const doc of documents) {
    if (doc.file instanceof File) {
      const sanitizedName = sanitizeFilename(doc.name);
      const filePath = `documentos/${codigo_cadastro}/${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from('cadastros') 
        .upload(filePath, doc.file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Erro ao fazer upload do documento:', error);
        toast({
          title: "Erro de Upload",
          description: `Falha ao enviar ${doc.name}: ${error.message}`,
          variant: "destructive"
        });
      } else {
         uploadedFilesInfo.push({ name: doc.name, type: doc.type, size: doc.size, path: data.path });
      }
    } else {
       if (doc.name && doc.path) {
           uploadedFilesInfo.push(doc);
       }
    }
  }
  return uploadedFilesInfo;
};

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitForm = async (formData, logoConfig = null, isEditMode = false) => {
    setIsSubmitting(true);
    
    try {
      const codigo_cadastro = isEditMode && formData.codigo_cadastro ? formData.codigo_cadastro : gerarCodigo();
      const uploadedDocsInfo = await uploadDocumentsToSupabase(formData.documentos, codigo_cadastro);

      let data_cadastro_to_submit;
      if (isEditMode && formData.data_cadastro) {
        const existingDate = new Date(formData.data_cadastro);
        data_cadastro_to_submit = !isNaN(existingDate.getTime())
          ? existingDate.toISOString()
          : new Date().toISOString();
      } else {
        data_cadastro_to_submit = new Date().toISOString();
      }
      
      const dataToSubmit = {};

      for (const key in initialFormData) {
        if (formData.hasOwnProperty(key)) {

          if (key === 'documentos') {
            dataToSubmit[key] = JSON.stringify(uploadedDocsInfo);

          } else if (key === 'data_nascimento') {
            dataToSubmit[key] = formData[key] ? formatData(formData[key], 'YYYY-MM-DD') : null;
            if (dataToSubmit[key] === 'Data inválida') dataToSubmit[key] = null;

          } else if (['renda_mensal', 'valor_credito', 'valor_entrada', 'valor_parcela', 'parcelas'].includes(key)) {
            const rawValue = formData[key];
            if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
                const numericValue = key === 'parcelas'
                  ? parseInt(rawValue, 10)
                  : parseFloat(rawValue);
                dataToSubmit[key] = isNaN(numericValue) ? null : numericValue;
            } else {
                dataToSubmit[key] = null;
            }

          // 🔥 TRATAMENTO ESPECIAL PARA EMAIL
          } else if (key === 'email') {
            const emailValue = formData[key];
            dataToSubmit[key] = emailValue && emailValue.trim() !== ''
              ? emailValue
              : 'NÃO INFORMADO';

          } else if (formData[key] !== undefined) {
            dataToSubmit[key] = formData[key] === '' ? null : formData[key];
          }

        } else if (
          initialFormData.hasOwnProperty(key) &&
          (initialFormData[key] === null || initialFormData[key] === '')
        ) {
          dataToSubmit[key] = null;
        }
      }
      
      const finalData = {
        ...dataToSubmit,
        codigo_cadastro,
        data_cadastro: data_cadastro_to_submit,
        status_cliente: isEditMode
          ? (formData.status_cliente || 'pendente')
          : 'pendente'
      };
      
      if (finalData.hasOwnProperty('id')) delete finalData.id;
      if (finalData.hasOwnProperty('created_at')) delete finalData.created_at;

      let savedToSupabase = false;
      let operationError = null;

      if (supabase) {
        try {
          if (isEditMode) {
            const identifierField = formData.id ? 'id' : 'codigo_cadastro';
            const identifierValue = formData.id || formData.codigo_cadastro;

            if (!identifierValue) {
                throw new Error("Identificador não encontrado para edição.");
            }
            
            const updateData = { ...finalData };
            if (identifierField === 'id') delete updateData.id;
            
            const { error } = await supabase
              .from('cadastros')
              .update(updateData)
              .eq(identifierField, identifierValue);

            operationError = error;

          } else {
            const { error } = await supabase
              .from('cadastros')
              .insert([finalData]);

            operationError = error;
          }
            
          if (operationError) {
            toast({
              title: "Erro Supabase",
              description: `Falha ao ${isEditMode ? 'atualizar' : 'salvar'}: ${operationError.message}`,
              variant: "destructive"
            });
          } else {
            savedToSupabase = true;
          }

        } catch (supabaseErr) {
          toast({
            title: "Aviso Supabase",
            description: "Supabase não disponível.",
            variant: "destructive"
          });
        }
      }
      
      let localDataToSave = { ...formData };
      localDataToSave.documentos = JSON.stringify(uploadedDocsInfo);
      localDataToSave.email = dataToSubmit.email; // garante consistência no PDF
      
      localDataToSave = { 
        ...localDataToSave, 
        codigo_cadastro, 
        data_cadastro: formatDataHora(data_cadastro_to_submit),
        status_cliente: finalData.status_cliente,
        id: formData.id || null
      };

      try {
        const doc = await generatePDF(localDataToSave, logoConfig); 
        const pdfBlob = doc.output('blob');
        
        const messageBot1 = formatTelegramMessage(localDataToSave); 
        await sendToTelegram(messageBot1, pdfBlob, 1);

        const messageBot2 = formatTelegramMessageForBot2(localDataToSave);
        await sendToTelegram(null, pdfBlob, 2, messageBot2);

      } catch (telegramError) {
        toast({
          title: "Aviso Telegram",
          description: "Salvo, mas erro no envio ao Telegram.",
          variant: "default"
        });
      }
      
      toast({
        title: isEditMode ? "Cadastro Atualizado!" : "Sucesso!",
        description: `Cadastro ${codigo_cadastro} processado com sucesso!`,
        variant: "default"
      });
      
      return { success: true, codigo_cadastro, data: localDataToSave };
      
    } catch (error) {
      toast({
        title: "Erro Geral",
        description: "Falha ao processar cadastro.",
        variant: "destructive"
      });
      
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    submitForm,
    isSubmitting
  };
};
