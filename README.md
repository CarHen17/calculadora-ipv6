# 🌐 Calculadora de Sub-Redes IPv6

Uma ferramenta web avançada e intuitiva para calcular, visualizar, gerenciar e agregar sub-redes IPv6. Desenvolvida com foco na experiência do usuário e funcionalidades práticas para profissionais de redes.

🔗 **Acesse o site:** [carhen17.github.io/calculadora-ipv6](https://carhen17.github.io/calculadora-ipv6)

---

## ✨ Funcionalidades Principais

### 🔧 **Cálculo e Visualização**
- **Validação automática** de blocos IPv6 no formato CIDR
- **Geração incremental** de sub-redes com processamento assíncrono
- **Visualização em tabela** com seleção individual e múltipla
- **Formatação inteligente** - exibe versões compactas dos endereços IPv6
- **Informações detalhadas** na sidebar para blocos selecionados

### 🔗 **Agregação de Blocos**
- **Agregação automática** de blocos consecutivos
- **Validação de compatibilidade** para agregação
- **Visualização do bloco agregado** com informações completas
- **Suporte para múltiplos blocos** (2, 4, 8, 16... blocos)

### 📋 **Gerenciamento de IPs**
- **Geração de listas de IPs** para qualquer bloco selecionado
- **Carregamento por demanda** (50 IPs por vez)
- **Cópia rápida** com um clique
- **Reset e regeneração** de listas

### 📊 **Exportação de Dados**
- **Múltiplos formatos**: CSV, Excel (.xlsx), TXT, JSON
- **Nomes personalizáveis** para arquivos
- **Metadados inclusos** (data, origem, estatísticas)
- **Interface intuitiva** para seleção de formato

### 🎨 **Interface e UX**
- **Modo escuro/claro** com persistência de preferência
- **Design responsivo** otimizado para mobile e desktop
- **Indicador de progresso** visual para operações longas
- **Notificações informativas** para feedback do usuário
- **Navegação fluida** com atalhos de teclado

### 🌍 **Recursos Adicionais**
- **DNS públicos IPv6** pré-configurados (Google, Cloudflare)
- **Gateway automático** calculado para cada bloco
- **Histórico de uso** (em desenvolvimento)
- **Sugestões inteligentes** de prefixos comuns

---

## 🚀 Como Usar

### 1️⃣ **Inserir Bloco IPv6**
Digite um bloco IPv6 no formato CIDR válido:
```
2001:db8::/40
2001:0db8:0000::/48
fe80::/64
```

### 2️⃣ **Escolher Prefixo**
Selecione o novo tamanho de prefixo para dividir o bloco:
- **Prefixos comuns** destacados com descrições de uso
- **Agrupamento inteligente** por categoria
- **Validação automática** de compatibilidade

### 3️⃣ **Gerenciar Sub-redes**
- **Clique simples**: Selecionar bloco individual para detalhes
- **Checkbox**: Seleção múltipla para agregação
- **Exportar**: Gerar listas de IPs em vários formatos

### 4️⃣ **Recursos Avançados**
- **Agregação**: Selecione blocos consecutivos para criar blocos maiores
- **Exportação**: Escolha entre CSV, Excel, TXT ou JSON
- **Temas**: Alterne entre modo claro e escuro

---

## 🛠️ Tecnologias Utilizadas

### **Frontend Core**
- **HTML5** semântico e acessível
- **CSS3** com Custom Properties e Grid/Flexbox
- **JavaScript ES6+** modular e assíncrono

### **Funcionalidades Específicas**
- **BigInt** para cálculos precisos de IPv6 (128 bits)
- **Web Workers** simulados para processamento assíncrono
- **SheetJS** para exportação Excel
- **Font Awesome** para iconografia
- **CSS Grid/Flexbox** para layout responsivo

### **Arquitetura**
```
js/
├── core/
│   ├── app.js              # Inicialização principal
│   ├── ipv6-calculator.js  # Lógica de cálculo
│   └── ui-controller.js    # Controle da interface
└── utils/
    ├── ipv6-utils.js       # Utilitários IPv6
    └── export-utils.js     # Exportação de dados
```

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + Enter` | Calcular sub-redes |
| `Ctrl + D` | Alternar tema |
| `Escape` | Resetar calculadora |
| `Ctrl + A` | Selecionar todas as sub-redes |

---

## 📱 Compatibilidade

### **Navegadores Suportados**
- ✅ Chrome 67+ (BigInt suporte)
- ✅ Firefox 68+
- ✅ Safari 14+
- ✅ Edge 79+

### **Dispositivos**
- 📱 **Mobile**: Interface otimizada para toque
- 💻 **Desktop**: Funcionalidades completas
- 📱 **Tablet**: Layout adaptativo

---

## 🔧 Instalação Local

```bash
# Clonar repositório
git clone https://github.com/CarHen17/calculadora-ipv6.git

# Navegar para o diretório
cd calculadora-ipv6

# Servir localmente (Python)
python -m http.server 8000

# Ou usar Live Server no VS Code
# Ou qualquer servidor HTTP local
```

Acesse: `http://localhost:8000`

---

## 🤝 Como Contribuir

### **Processo de Contribuição**
1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/SEU_USUARIO/calculadora-ipv6.git`
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Faça** suas alterações seguindo os padrões do código
5. **Teste** localmente
6. **Commit**: `git commit -m 'feat: adiciona nova funcionalidade'`
7. **Push**: `git push origin feature/nova-funcionalidade`
8. **Abra** um Pull Request

### **Padrões de Código**
- **ES6+** com módulos
- **JSDoc** para documentação
- **Nomenclatura** em português nos comentários
- **Console.log** estruturado com prefixos `[Módulo]`

### **Tipos de Contribuição**
- 🐛 **Correção de bugs**
- ✨ **Novas funcionalidades**
- 📝 **Melhorias na documentação**
- 🎨 **Melhorias na interface**
- 🌍 **Traduções**

---

## 📋 Roadmap

### **Versão Atual (v2.0)**
- ✅ Seleção individual de blocos
- ✅ Agregação automática
- ✅ Exportação múltiplos formatos
- ✅ Interface moderna
- ✅ Modo escuro

### **Próximas Versões**
- [ ] **Histórico** de blocos utilizados
- [ ] **Comparação** entre blocos
- [ ] **Templates** de configuração
- [ ] **API** para integração
- [ ] **PWA** (Progressive Web App)
- [ ] **Calculadora VLSM** IPv6
- [ ] **Tradução** para inglês
- [ ] **Exportação** para formatos de configuração (Cisco, Juniper)

---

## 📊 Estatísticas do Projeto

- 📁 **Arquivos**: 15+ arquivos organizados
- 🧩 **Módulos**: 4 módulos principais
- 🎨 **Estilos**: 6 arquivos CSS modulares
- ⚡ **Performance**: Processamento assíncrono
- 📱 **Responsivo**: Mobile-first design
- 🌙 **Temas**: Claro e escuro
- 🌍 **Acessibilidade**: WCAG 2.1 compatível

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙌 Agradecimentos

### **Criado por**
**[Carlos Henrique](https://github.com/CarHen17)**

### **Bibliotecas Utilizadas**
- [Font Awesome](https://fontawesome.com/) - Ícones
- [SheetJS](https://sheetjs.com/) - Exportação Excel
- [Google Fonts](https://fonts.google.com/) - Tipografia Inter

### **Inspiração**
Desenvolvido para suprir a necessidade de uma ferramenta IPv6 completa, intuitiva e gratuita para profissionais de infraestrutura de redes.


