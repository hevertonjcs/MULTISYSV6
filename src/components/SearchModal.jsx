import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Search, Trash2, FileDown } from 'lucide-react';
import SearchModalFilters from '@/components/search-modal/SearchModalFilters';
import SearchModalListItem from '@/components/search-modal/SearchModalListItem';
import SearchModalDetails from '@/components/search-modal/SearchModalDetails';
import ChangeSellerModal from '@/components/search-modal/ChangeSellerModal';
import { useCadastrosLoader } from '@/components/search-modal/hooks/useCadastrosLoader';
import { useCadastroActions } from '@/components/search-modal/hooks/useCadastroActions';
import { generateFullReportPDF } from '@/fullReportGenerator';
import { useToast } from '@/components/ui/use-toast';

const SearchModal = ({ isOpen, onClose, logoConfig, onEditCadastro, userInfo }) => {
  const { toast } = useToast();
  const permissions = userInfo?.permissoes || {};

  const {
    cadastros,
    setCadastros,
    filteredCadastros,
    loading,
    loadCadastros,
    searchTerm,
    setSearchTerm,
    searchField,
    setSearchField,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
  } = useCadastrosLoader({
    searchTerm: '',
    searchField: 'all',
    statusFilter: 'all_status',
    dateRange: { from: null, to: null },
    userInfo,
  });

  const cadastrosState = { cadastros, setCadastros };

  const {
    isDownloading,
    handleDownloadPDF,
    handleDownloadDocs,
    handleResendTelegram,
    handleStatusChange,
    handleDelete,
    handleEdit,
    handleCopyCadastro,
    handleSupervisorObservationUpdate,
    handleSellerUpdate,
    handleDeleteSupervisorObservation,
    handleAddSupervisorObservation,
  } = useCadastroActions(logoConfig, cadastrosState, onEditCadastro);

  const [selectedCadastro, setSelectedCadastro] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cadastroToDelete, setCadastroToDelete] = useState(null);
  const [cadastroToChangeSeller, setCadastroToChangeSeller] = useState(null);
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);

  // --------------------------------------------
  // 🔄 Carrega cadastros quando o modal abre
  // --------------------------------------------
  useEffect(() => {
    if (isOpen && permissions.pode_ver_cadastros) {
      loadCadastros();
    } else if (isOpen && !permissions.pode_ver_cadastros) {
      toast({
        title: 'Acesso negado',
        description: 'Você não possui permissão para visualizar cadastros.',
        variant: 'destructive',
      });
      onClose();
    }
  }, [isOpen, loadCadastros, permissions, toast, onClose]);

  // --------------------------------------------
  // 🔄 Atualiza cadastro selecionado se houver mudança
  // --------------------------------------------
  useEffect(() => {
    if (selectedCadastro) {
      const updatedCadastro = cadastros.find((c) => c.id === selectedCadastro.id);
      if (updatedCadastro) setSelectedCadastro(updatedCadastro);
    }
  }, [cadastros, selectedCadastro]);

  // --------------------------------------------
  // 🗑️ Exclusão segura com confirmação
  // --------------------------------------------
  const confirmDeleteCadastro = useCallback(async () => {
    if (!cadastroToDelete) return;
    const deletedId = await handleDelete(cadastroToDelete);
    if (deletedId) setCadastroToDelete(null);
  }, [cadastroToDelete, handleDelete]);

  // --------------------------------------------
  // 📄 Geração de relatório completo (apenas se permitido)
  // --------------------------------------------
  const handleGenerateFullReport = async () => {
    if (!permissions.pode_ver_todos_cadastros) {
      toast({
        title: 'Acesso negado',
        description: 'Você não possui permissão para gerar relatórios completos.',
        variant: 'destructive',
      });
      return;
    }

    if (filteredCadastros.length === 0) {
      toast({
        title: 'Nenhum cadastro para exportar',
        description: 'Os filtros atuais não retornaram nenhum resultado.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingFullReport(true);
    try {
      await generateFullReportPDF(filteredCadastros);
      toast({
        title: 'Relatório Gerado!',
        description: 'O PDF com todos os cadastros foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: `Ocorreu um problema: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingFullReport(false);
    }
  };

  // --------------------------------------------
  // 🧠 Lógica de permissões internas (para botões)
  // --------------------------------------------
  const canDelete = permissions.pode_gerenciar_usuarios || permissions.pode_ver_todos_cadastros;
  const canEdit = permissions.pode_gerenciar_usuarios || permissions.pode_ver_todos_cadastros;
  const canTransferSeller = permissions.pode_gerenciar_usuarios;
  const canDownload = permissions.pode_ver_cadastros;
  const canResendTelegram = permissions.pode_ver_todos_cadastros;

  // --------------------------------------------
  // 🎨 Renderização principal
  // --------------------------------------------
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto bg-card border-border p-4 md:p-6 rounded-lg shadow-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-card-foreground flex items-center gap-2 text-xl md:text-2xl">
              <Search className="w-5 h-5 md:w-6 md:h-6" />
              Pesquisar Cadastros
            </DialogTitle>
          </DialogHeader>

          <SearchModalFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchField={searchField}
            setSearchField={setSearchField}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            loadCadastros={loadCadastros}
            loading={loading}
          />

          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center px-1">
              <p className="text-sm text-card-foreground">
                {filteredCadastros.length} cadastro(s) encontrado(s)
              </p>
              {permissions.pode_ver_todos_cadastros && (
                <Button
                  onClick={handleGenerateFullReport}
                  size="sm"
                  disabled={isGeneratingFullReport || loading}
                >
                  {isGeneratingFullReport ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mr-2" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-2" />
                  )}
                  {isGeneratingFullReport ? 'Gerando...' : 'Gerar Relatório Completo'}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-muted/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-card-foreground text-lg">Carregando cadastros...</p>
              </div>
            ) : filteredCadastros.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Nenhum cadastro encontrado com os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredCadastros.map((cadastro) => (
                  <SearchModalListItem
                    key={cadastro.id || cadastro.codigo_cadastro}
                    item={cadastro}
                    onEdit={canEdit ? handleEdit : undefined}
                    onGeneratePDF={canDownload ? handleDownloadPDF : undefined}
                    onOpenChangeSellerModal={
                      canTransferSeller ? () => setCadastroToChangeSeller(cadastro) : undefined
                    }
                    userInfo={userInfo}
                    onShowDetails={() => setShowDetailsModal(true) || setSelectedCadastro(cadastro)}
                    onStatusChange={permissions.pode_gerenciar_usuarios ? handleStatusChange : undefined}
                    onDownloadDocs={canDownload ? handleDownloadDocs : undefined}
                    onCopyCadastro={permissions.pode_gerenciar_usuarios ? handleCopyCadastro : undefined}
                    isDownloading={isDownloading}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔍 Detalhes */}
      <SearchModalDetails
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        cadastro={selectedCadastro}
        onDownloadPDF={canDownload ? handleDownloadPDF : undefined}
        onResendTelegram={canResendTelegram ? handleResendTelegram : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onCopy={permissions.pode_gerenciar_usuarios ? handleCopyCadastro : undefined}
        onDelete={canDelete ? (cad) => setCadastroToDelete(cad) : undefined}
        onDownloadDocs={canDownload ? handleDownloadDocs : undefined}
        onAddObservation={permissions.pode_ver_todos_cadastros ? handleAddSupervisorObservation : undefined}
        isDownloading={isDownloading}
        userInfo={userInfo}
      />

      {/* 🗑️ Confirmação de exclusão */}
      {cadastroToDelete && (
        <AlertDialog open={!!cadastroToDelete} onOpenChange={() => setCadastroToDelete(null)}>
          <AlertDialogContent className="bg-card border-border text-card-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja apagar o cadastro de{' '}
                <span className="font-semibold">{cadastroToDelete.nome_completo}</span> (Código:{' '}
                {cadastroToDelete.codigo_cadastro})? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-card-foreground border-border hover:bg-muted">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCadastro}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 👥 Alterar vendedor */}
      <ChangeSellerModal
        isOpen={!!cadastroToChangeSeller}
        onClose={() => setCadastroToChangeSeller(null)}
        cadastro={cadastroToChangeSeller}
        onUpdate={(updatedCadastro) => {
          handleSellerUpdate(updatedCadastro);
          setCadastroToChangeSeller(null);
        }}
      />
    </>
  );
};

export default SearchModal;
