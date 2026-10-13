import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, ProductCategory, ProductDestination } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Wine,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Tag,
} from 'lucide-react';

export const MenuManagerScreen: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
  } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState<'todos' | ProductCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal for creating/editing product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('12.00');
  const [formCategory, setFormCategory] = useState<ProductCategory>('fuertes');
  const [formDestination, setFormDestination] = useState<ProductDestination>('cocina');
  const [formPrepTime, setFormPrepTime] = useState<number>(12);
  const [formBadge, setFormBadge] = useState<string>('');

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const categories: { id: 'todos' | ProductCategory; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'fuertes', label: 'Platos Fuertes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'cocteles', label: 'Coctelería' },
    { id: 'postres', label: 'Postres' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('10.00');
    setFormCategory('fuertes');
    setFormDestination('cocina');
    setFormPrepTime(10);
    setFormBadge('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setFormDestination(product.destination);
    setFormPrepTime(product.prepTimeMinutes);
    setFormBadge(product.badge || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = parseFloat(formPrice) || 0;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        destination: formDestination,
        prepTimeMinutes: formPrepTime,
        badge: formBadge.trim() ? formBadge.trim() : undefined,
      });
    } else {
      addProduct({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        destination: formDestination,
        prepTimeMinutes: formPrepTime,
        available: true,
        badge: formBadge.trim() ? formBadge.trim() : undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Banner & Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Administrador del Menú</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
              {products.length} platillos registrados
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Agrega nuevos productos, modifica precios o retira platos agotados en cocina
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Agregar Nuevo Producto</span>
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid de Productos con Controles de Edición y Eliminación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((product) => {
          return (
            <div
              key={product.id}
              className={`bg-stone-900 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                !product.available
                  ? 'border-stone-800 opacity-60 bg-stone-950/60'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              <div>
                {/* Badges & Destination */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        product.destination === 'bar'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      {product.destination === 'bar' ? (
                        <Wine className="w-3 h-3" />
                      ) : (
                        <Flame className="w-3 h-3" />
                      )}
                      {product.destination === 'bar' ? 'Bar' : 'Cocina'}
                    </span>

                    <span className="text-[10px] uppercase font-semibold text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                      {product.category}
                    </span>

                    {product.badge && (
                      <span className="text-[10px] font-medium bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatMXN(product.price)}
                  </span>
                </div>

                {/* Title & Description */}
                <h4 className="font-bold text-sm text-white">{product.name}</h4>
                <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {product.description || 'Sin descripción detallada.'}
                </p>

                <div className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Tiempo estimado: ~{product.prepTimeMinutes} minutos</span>
                </div>
              </div>

              {/* Controles de Disponibilidad y Acciones */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                {/* Toggle Agotado / Disponible */}
                <button
                  type="button"
                  onClick={() => toggleProductAvailability(product.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    product.available
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                  }`}
                  title="Marcar como disponible o agotado hoy en cocina"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      product.available ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{product.available ? 'Disponible' : 'Agotado (86)'}</span>
                </button>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                    title="Editar producto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setProductToDelete(product)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Agregar o Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingProductId ? 'Editar Platillo / Bebida' : 'Nuevo Platillo / Bebida'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nombre del Platillo o Bebida:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Ojo de Bife con Papas Trufadas"
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Precio ($):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Tiempo Prep. (min):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(parseInt(e.target.value) || 5)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="entradas">Entradas</option>
                    <option value="fuertes">Platos Fuertes</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="cocteles">Coctelería</option>
                    <option value="postres">Postres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Destino Comanda:
                  </label>
                  <select
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value as ProductDestination)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cocina">Cocina 🔥</option>
                    <option value="bar">Bar / Bebidas 🍹</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Descripción / Ingredientes:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre ingredientes, guarniciones y preparación..."
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Etiqueta / Insignia (Opcional):
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="Ej: Recomendado, Especial, Chef, Nuevo..."
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingProductId ? 'Guardar Cambios' : 'Añadir al Menú'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-white">¿Quitar este producto?</h4>
            <p className="text-xs text-stone-400">
              Vas a eliminar <strong>"{productToDelete.name}"</strong> del menú. Esta acción quitará el platillo de la lista de pedidos.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
