import React, { useState } from "react";
import { ShieldCheck, FileText, ShoppingBag, Users, Trash2, Baby, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { LEGAL_POLICIES, LegalDocument } from "../services/legalPoliciesData";

interface LegalPoliciesModalProps {
  isOpen: boolean;
  initialDocId?: "PRIVACY" | "TERMS" | "PURCHASES" | "COMMUNITY" | "DELETE_ACCOUNT" | "MINORS_POLICY";
  onClose: () => void;
  onConfirmDeleteAccount?: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  initialDocId = "PRIVACY",
  onClose,
  onConfirmDeleteAccount
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);

  if (!isOpen) return null;

  const currentDoc: LegalDocument = LEGAL_POLICIES[selectedDocId] || LEGAL_POLICIES.PRIVACY;

  const tabs = [
    { id: "PRIVACY", label: "Privacidad", icon: ShieldCheck },
    { id: "TERMS", label: "Términos", icon: FileText },
    { id: "PURCHASES", label: "Compras", icon: ShoppingBag },
    { id: "COMMUNITY", label: "Comunidad", icon: Users },
    { id: "MINORS_POLICY", label: "Protección Familiar", icon: Baby },
    { id: "DELETE_ACCOUNT", label: "Borrar Cuenta", icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 text-stone-200 animate-fade-in">
      <div className="bg-[#1C1813] border-2 border-amber-500/80 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-4 ring-amber-500/20">
        
        {/* CABECERA */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentDoc.icon}</span>
            <div>
              <h3 className="font-serif font-black text-sm sm:text-base text-amber-100 uppercase tracking-wider">
                Centro Legal, Privacidad y Términos
              </h3>
              <p className="text-[10px] text-stone-400">
                Biblos Games · Actualizado al {currentDoc.lastUpdated}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900/80 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVEGACIÓN ENTRE POLÍTICAS */}
        <div className="flex bg-stone-950/90 border-b border-stone-800 p-1.5 gap-1 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isSelected = selectedDocId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedDocId(tab.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-stone-950 shadow ring-1 ring-amber-300"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
                }`}
              >
                <IconComp size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENIDO DEL DOCUMENTO */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-left flex-1">
          <div className="border-b border-stone-800 pb-3">
            <h4 className="text-base sm:text-lg font-serif font-black text-amber-200">
              {currentDoc.title}
            </h4>
            <p className="text-xs text-amber-400/90 font-medium mt-0.5">
              {currentDoc.subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {currentDoc.content.map((sec, idx) => (
              <div key={idx} className="bg-stone-900/70 p-3.5 rounded-2xl border border-stone-800 space-y-1.5">
                <h5 className="text-xs sm:text-sm font-bold text-amber-300">
                  {sec.sectionTitle}
                </h5>
                <div className="space-y-1 text-xs text-stone-300 leading-relaxed">
                  {sec.body.map((par, pIdx) => (
                    <p key={pIdx}>{par}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CASO ESPECIAL: ACCIÓN DE ELIMINACIÓN DE CUENTA */}
          {selectedDocId === "DELETE_ACCOUNT" && (
            <div className="p-4 bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl space-y-2.5 text-center mt-4">
              <h5 className="text-sm font-black text-rose-300 uppercase">
                ⚠️ Zona de Peligro: Borrado Permanente de Perfil
              </h5>
              <p className="text-xs text-stone-300">
                Esta acción no se puede deshacer. Todos tus datos locales y logros se eliminarán de inmediato.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Estás 100% seguro de que deseas eliminar permanentemente tu cuenta y todos tus datos de Biblos Games?")) {
                    localStorage.clear();
                    alert("✅ Tu cuenta y datos locales han sido eliminados por completo.");
                    window.location.reload();
                  }
                }}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                Eliminar Mi Cuenta Definitivamente
              </button>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-xs">
          <span className="text-stone-400 text-[10px]">
            Biblos Papelería y Librería Cristiana SRL © 2026
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
