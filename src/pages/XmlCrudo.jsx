// ─── XML Crudo ───────────────────────────────────────
// Importar o visualizar información cruda para convertir en proyectos/actividades

import React, { useState } from "react";
import { Code2, Upload, Download, Info } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function XmlCrudo() {
  const { projects, activities } = useApp();
  const [xmlInput, setXmlInput] = useState("");
  const [mode, setMode] = useState("import"); // "import" | "export"

  const exportData = () => {
    const data = {
      proyectos: projects,
      actividades: activities,
      exportadoEn: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foga-flow-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">XML / Datos Crudos</h1>
        <p className="text-slate-500 text-sm mt-1">Importa o exporta información del sistema</p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">¿Para qué sirve esta sección?</p>
          <ul className="space-y-0.5 text-blue-600">
            <li>• Exportar todos los proyectos y actividades como JSON</li>
            <li>• Importar datos de otras fuentes (XML, JSON)</li>
            <li>• Respaldar información periódicamente</li>
            <li>• Revisar la estructura de datos raw del sistema</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setMode("import")} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${mode === "import" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          Importar
        </button>
        <button onClick={() => setMode("export")} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${mode === "export" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          Exportar
        </button>
      </div>

      {mode === "import" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pegar datos XML o JSON</label>
            <textarea
              value={xmlInput}
              onChange={e => setXmlInput(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none resize-none bg-slate-50 text-slate-700"
              placeholder={`Pega aquí tu XML o JSON...\n\nEjemplo JSON:\n{\n  "proyectos": [],\n  "actividades": []\n}`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert("Función de importación: próximamente. Pega tus datos y el sistema los convertirá en proyectos y actividades.")}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              <Upload size={15} /> Procesar datos
            </button>
            <button onClick={() => setXmlInput("")} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
              Limpiar
            </button>
          </div>
        </div>
      )}

      {mode === "export" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Datos actuales del sistema</p>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
              <Download size={15} /> Descargar JSON
            </button>
          </div>
          <pre className="w-full p-4 text-xs font-mono bg-slate-900 text-green-400 rounded-xl overflow-auto max-h-96 leading-relaxed">
            {exportData()}
          </pre>
        </div>
      )}
    </div>
  );
}
