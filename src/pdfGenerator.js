import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatData, formatMoeda } from '@/utils';

export const generatePDF = async (formData, logoConfig = null) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 30;
  const contentWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // 🎨 NOVA PALETA (Preto leve elegante)
  const primaryColor = [28, 28, 30];     // Preto grafite
  const secondaryColor = [90, 90, 95];   // Cinza médio
  const textColor = [40, 40, 40];        // Preto leve texto
  const footerColor = [150, 150, 150];

  const multinegociacoesLogoUrl =
    'https://bfxamibaxsyxltqkiftd.supabase.co/storage/v1/object/public/logocentral/logooz.png';

  /* ----------------------------------------------------- */
  /* CONTROLE DE PÁGINA */
  /* ----------------------------------------------------- */

  const checkPageBreak = (spaceNeeded = 20) => {
    if (yPosition + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  /* ----------------------------------------------------- */
  /* TÍTULO DE SEÇÃO */
  /* ----------------------------------------------------- */

  const addSectionTitle = (title) => {
    checkPageBreak(30);

    yPosition += 10;

    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, contentWidth, 2, 'F');

    yPosition += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(title.toUpperCase(), margin, yPosition);

    yPosition += 18;
  };

  /* ----------------------------------------------------- */
  /* CAMPOS */
  /* ----------------------------------------------------- */

  const addField = (
    label,
    value,
    xOffset = 0,
    maxWidth = contentWidth / 2,
    increment = 14,
    fullWidth = false
  ) => {
    checkPageBreak(20);

    const val = value || 'N/A';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.text(label + ':', margin + xOffset, yPosition);

    doc.setFontSize(8);
    doc.setTextColor(...textColor);

    const labelWidth =
      (doc.getStringUnitWidth(label + ':') * 7) /
      doc.internal.scaleFactor;

    const valueX = margin + xOffset + labelWidth + 4;

    doc.text(String(val), valueX, yPosition, {
      maxWidth: fullWidth
        ? contentWidth - labelWidth - 8
        : maxWidth - labelWidth - 8
    });

    yPosition += increment;
  };

  const addTwoFields = (label1, value1, label2, value2) => {
    const half = contentWidth / 2;

    addField(label1, value1, 0, half, 0);
    addField(label2, value2, half, half);

  };

  /* ----------------------------------------------------- */
  /* INÍCIO DO DOCUMENTO */
  /* ----------------------------------------------------- */

  try {
    let headerStartY = yPosition;
    let logoHeightUsed = 0;

    /* -------- LOGO -------- */

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = multinegociacoesLogoUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const maxHeight = 120;
      const aspectRatio = img.width / img.height;

      let logoHeight = maxHeight;
      let logoWidth = logoHeight * aspectRatio;

      if (logoWidth > contentWidth * 0.5) {
        logoWidth = contentWidth * 0.5;
        logoHeight = logoWidth / aspectRatio;
      }

      const logoX = pageWidth - margin - logoWidth;

      doc.addImage(img, 'PNG', logoX, headerStartY, logoWidth, logoHeight);

      logoHeightUsed = logoHeight;

    } catch (err) {
      console.warn('Erro ao carregar logo');
    }

    /* -------- TÍTULO -------- */
   doc.setFont('helvetica', 'bold');
    doc.setFontSize(20); 
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FICHA DE CADASTRO', margin, initialYForText + 12); 
    initialYForText += 24; 

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); 
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(formData.empresa_nome || 'Multinegociações LTDA', margin, initialYForText);
    initialYForText += 12; 
    doc.text(`Código: ${formData.codigo_cadastro || 'N/A'} | Data: ${formatData(formData.data_cadastro, 'DD/MM/YYYY HH:mm') || 'N/A'}`, margin, initialYForText);
    
    yPosition = Math.max(initialYForText + 25, yPosition + logoMaxHeightUsed + 10);


    addSectionTitle('DADOS DE ACESSO');
    addTwoFields('Usuário/Vendedor', formData.vendedor, 'Empresa', formData.equipe);
    addField('Modalidade', formData.modalidade, 0, contentWidth / 2, 14, true);
    yPosition += 6;

    addSectionTitle('DADOS PESSOAIS');
    addField('Nome Completo', formData.nome_completo, 0, contentWidth / 2, 14, true);
    addTwoFields('CPF', formData.cpf, 'RG', formData.rg);
    addTwoFields('Órgão Expedidor', formData.orgao_expedidor, 'Data de Nascimento', formatData(formData.data_nascimento));
    addTwoFields('Estado Civil', formData.estado_civil, 'Sexo', formData.sexo);
    addField('Nome da Mãe', formData.nome_mae, 0, contentWidth / 2, 14, true);
    addField('Nome do Pai', formData.nome_pai, 0, contentWidth / 2, 14, true);
    if (formData.estado_civil && formData.estado_civil.toLowerCase().includes('casado')) {
      addField('Nome Cônjuge', formData.nome_conjuge, 0, contentWidth / 2, 14, true);
    }
    yPosition += 6;

    addSectionTitle('DADOS RESIDENCIAIS');
    addField('Endereço', `${formData.endereco || ''}, ${formData.numero_residencia || ''}`, 0, contentWidth / 2, 14, true);
    addTwoFields('Bairro', formData.bairro, 'Cidade', formData.cidade);
    addTwoFields('Estado (UF)', formData.estado_uf, 'CEP', formData.cep);
    addField('Complemento', formData.complemento, 0, contentWidth / 2, 14, true);
    addField('Observação Residencial', formData.observacao_residencial, 0, contentWidth / 2, 14, true);
    yPosition += 6;

    addSectionTitle('INFORMAÇÕES DE CONTATO');
    addTwoFields('Telefone', formData.telefone, 'E-mail', formData.email);
    addField('Contato Adicional', formData.contato_adicional, 0, contentWidth / 2, 14, true);
    yPosition += 6;

    addSectionTitle('INFORMAÇÕES DE RENDA');
    addTwoFields('Profissão', formData.profissao, 'Renda Mensal', formatMoeda(String(formData.renda_mensal || '0')));
    addField('Tipo de Renda', formData.tipo_renda, 0, contentWidth / 2, 14, true);
    yPosition += 6;

    addSectionTitle('PROPOSTA DE CRÉDITO');
    addTwoFields('Valor do Crédito', formatMoeda(String(formData.valor_credito || '0')), 'Valor de Entrada', formatMoeda(String(formData.valor_entrada || '0')));
    addTwoFields('Nº Parcelas', formData.parcelas, 'Valor da Parcela', formatMoeda(String(formData.valor_parcela || '0')));
    addField('Segmento', formData.segmento, 0, contentWidth / 2, 14, true);
    addField('Observação Final', formData.observacao_final, 0, contentWidth / 2, 14, true);
    yPosition += 6;
    
    addSectionTitle('STATUS DO CLIENTE');
    addField('Status Atual', formData.status_cliente ? formData.status_cliente.replace('_',' ').toUpperCase() : 'N/A', 0, contentWidth / 2, 14, true);
    yPosition += 10;

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageWidth / 2,
        pageHeight - margin / 2,
        { align: 'center' }
      );
    }
    
    return doc;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    doc.text("Ocorreu um erro ao gerar o PDF. Verifique os dados.", margin, margin);
    return doc; 
  }
};

export const downloadPDF = async (formData, logoConfig = null) => {
  try {
    const doc = await generatePDF(formData, logoConfig);
    const filename = `cadastro_${formData.codigo_cadastro}_${formData.nome_completo.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    return doc.output('blob');
  } catch (error) {
    console.error('Erro no download do PDF:', error);
    throw error;
  }
};
