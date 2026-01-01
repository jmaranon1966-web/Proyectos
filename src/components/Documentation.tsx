import React, { useState } from 'react';
import { TECH_DOCS } from '../mockData';
import { ChevronRight } from 'lucide-react';

const Documentation: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState(TECH_DOCS[0].id);

  const currentDoc = TECH_DOCS.find(d => d.id === activeDoc);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-64 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Documentación</h2>
        <div className="space-y-1">
          {TECH_DOCS.map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                activeDoc === doc.id 
                  ? 'bg-emerald-50 text-emerald-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{doc.title}</span>
              {activeDoc === doc.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto p-8">
        {currentDoc ? (
          <article className="prose prose-slate max-w-none">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">{currentDoc.title}</h1>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm bg-slate-50 p-6 rounded-lg border border-slate-100">
              {currentDoc.content}
            </div>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Selecciona un documento para ver su contenido
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentation;