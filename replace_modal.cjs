const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Chemicals.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /{isAddModalOpen[\s\S]*?<\/AnimatePresence>/;
const replacement = `{/* Add / Edit Modal */}
      <ChemicalAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddChemical}
        onSmartFill={handleSmartFill}
        isGenerating={isGenerating}
        newChemical={newChemical}
        editingChemical={editingChemical}
        onChange={(field, value) => setNewChemical(prev => ({ ...prev, [field]: value }))}
      />`;

content = content.replace(regex, replacement);

// Also add import
if (!content.includes('ChemicalAddModal')) {
    content = content.replace("import QRScanner from '../components/QRScanner';", "import QRScanner from '../components/QRScanner';\nimport { ChemicalAddModal } from '../components/ChemicalAddModal';");
}


fs.writeFileSync(filePath, content);
console.log('Successfully replaced ChemicalAddModal block in Chemicals.tsx');
