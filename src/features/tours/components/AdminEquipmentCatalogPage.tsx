import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Image as ImageIcon, PackagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { tourAdminApi } from '../api/tourAdmin.api';
import type { EquipmentCatalogResponse, RentalPackageTemplateResponse } from '../types/tour-contract.types';

type Tab = 'equipment' | 'packages';
type EquipmentForm = { name: string; description: string; price: string };
type PackageForm = { title: string; sharedItems: string; personalItemsToBring: string; price: string };
type PackageItemForm = { checked: boolean; quantity: string; price: string };
const blankEquipment = (): EquipmentForm => ({ name: '', description: '', price: '' });
const blankPackage = (): PackageForm => ({ title: '', sharedItems: '', personalItemsToBring: '', price: '0' });
const inputClass = 'mt-1 w-full rounded-lg border border-[#CAD4CF] bg-white px-3 py-2.5 text-sm text-[#1C2526] outline-none focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15';
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B33] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#CAD4CF] bg-white px-3 py-2 text-sm font-semibold text-[#34413D] hover:bg-[#F5F7F5] disabled:opacity-50';
const errorText = (error: unknown, translate: (key: string) => string) => {
  if (error && typeof error === 'object') {
    const body = error as { code?: string; message?: string; fieldErrors?: Record<string, string> };
    if (body.code === 'TOUR_UNAVAILABLE') return translate('adminTour.unavailable');
    const fields = body.fieldErrors ? Object.entries(body.fieldErrors).map(([key, value]) => `${key}: ${value}`).join(' · ') : '';
    return [body.message, fields].filter(Boolean).join(' · ') || 'Request failed.';
  }
  return error instanceof Error ? error.message : translate('adminTour.error');
};

export default function AdminEquipmentCatalogPage({ onBack }: { onBack: () => void }) {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<Tab>('equipment');
  const [equipment, setEquipment] = useState<EquipmentCatalogResponse[]>([]);
  const [packages, setPackages] = useState<RentalPackageTemplateResponse[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentForm>(blankEquipment);
  const [packageForm, setPackageForm] = useState<PackageForm>(blankPackage);
  const [equipmentImageFile, setEquipmentImageFile] = useState<File | null>(null);
  const [packageImageFile, setPackageImageFile] = useState<File | null>(null);
  const [packageItems, setPackageItems] = useState<Record<number, PackageItemForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const money = useMemo(() => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-GB'), [language]);
  const chooseImage = (file: File | null, setFile: (file: File | null) => void) => {
    if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError(t('adminEquipment.imageLimit'));
      return;
    }
    setError('');
    setFile(file);
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [equipmentRows, packageRows] = await Promise.all([tourAdminApi.equipmentCatalog(), tourAdminApi.rentalPackages()]);
      setEquipment(equipmentRows); setPackages(packageRows);
    } catch (e) { setError(errorText(e, t)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const editEquipment = (row: EquipmentCatalogResponse) => {
    setSelectedEquipment(row.id);
    setEquipmentImageFile(null);
    setEquipmentForm({ name: row.name, description: row.description ?? '', price: row.individualRentalPriceVnd == null ? '' : String(row.individualRentalPriceVnd) });
    setError(''); setNotice('');
  };
  const resetEquipment = () => { setSelectedEquipment(null); setEquipmentForm(blankEquipment()); setEquipmentImageFile(null); };
  const saveEquipment = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const body = { name: equipmentForm.name.trim(), description: equipmentForm.description.trim() || null,
        individualRentalPriceVnd: equipmentForm.price === '' ? null : Number(equipmentForm.price) };
      const wasEditing = selectedEquipment !== null;
      const saved = wasEditing
        ? await tourAdminApi.updateEquipment(selectedEquipment, body)
        : await tourAdminApi.createEquipment(body);
      setSelectedEquipment(saved.id);
      if (equipmentImageFile) await tourAdminApi.uploadEquipmentImage(saved.id, equipmentImageFile);
      resetEquipment(); await load(); setNotice(t(wasEditing ? 'adminEquipment.equipmentSaved' : 'adminEquipment.equipmentCreated'));
    } catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };
  const deleteEquipment = async (row: EquipmentCatalogResponse) => {
    if (!window.confirm(t('adminEquipment.deleteEquipmentConfirm', { name: row.name }))) return;
    setSaving(true); setError(''); setNotice('');
    try { await tourAdminApi.deleteEquipment(row.id); if (selectedEquipment === row.id) resetEquipment(); await load(); setNotice(t('adminEquipment.equipmentDeleted')); }
    catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };
  const removeEquipmentImage = async () => {
    if (!selectedEquipment || !equipment.find((item) => item.id === selectedEquipment)?.imageUrl
      || !window.confirm(t('adminEquipment.removeImageConfirm'))) return;
    setSaving(true); setError(''); setNotice('');
    try { await tourAdminApi.deleteEquipmentImage(selectedEquipment); setEquipmentImageFile(null); await load(); setNotice(t('adminEquipment.imageRemoved')); }
    catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };

  const editPackage = (row: RentalPackageTemplateResponse) => {
    setSelectedPackage(row.id);
    setPackageImageFile(null);
    setPackageForm({ title: row.title, sharedItems: row.sharedItems ?? '', personalItemsToBring: row.personalItemsToBring ?? '', price: String(row.rentalPriceVnd) });
    setPackageItems(Object.fromEntries(row.items.map((item) => [item.equipmentId, { checked: true, quantity: String(item.quantityInPackage), price: item.individualRentalPriceVnd == null ? '' : String(item.individualRentalPriceVnd) }])));
    setError(''); setNotice('');
  };
  const resetPackage = () => { setSelectedPackage(null); setPackageForm(blankPackage()); setPackageItems({}); setPackageImageFile(null); };
  const savePackage = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const body = { title: packageForm.title.trim(), sharedItems: packageForm.sharedItems.trim() || null,
        personalItemsToBring: packageForm.personalItemsToBring.trim() || null, rentalPriceVnd: Number(packageForm.price),
        items: Object.entries(packageItems).filter(([, value]) => value.checked).map(([id, value]) => ({ equipmentId: Number(id),
          quantityInPackage: Number(value.quantity || 1), individualRentalPriceVnd: value.price === '' ? null : Number(value.price) })) };
      const wasEditing = selectedPackage !== null;
      const saved = wasEditing
        ? await tourAdminApi.updateRentalPackage(selectedPackage, body)
        : await tourAdminApi.createRentalPackage(body);
      setSelectedPackage(saved.id);
      if (packageImageFile) await tourAdminApi.uploadRentalPackageImage(saved.id, packageImageFile);
      resetPackage(); await load(); setNotice(t(wasEditing ? 'adminEquipment.packageSaved' : 'adminEquipment.packageCreated'));
    } catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };
  const deletePackage = async (row: RentalPackageTemplateResponse) => {
    if (!window.confirm(t('adminEquipment.deletePackageConfirm', { name: row.title }))) return;
    setSaving(true); setError(''); setNotice('');
    try { await tourAdminApi.deleteRentalPackage(row.id); if (selectedPackage === row.id) resetPackage(); await load(); setNotice(t('adminEquipment.packageDeleted')); }
    catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };
  const removePackageImage = async () => {
    if (!selectedPackage || !packages.find((item) => item.id === selectedPackage)?.imageUrl
      || !window.confirm(t('adminEquipment.removeImageConfirm'))) return;
    setSaving(true); setError(''); setNotice('');
    try { await tourAdminApi.deleteRentalPackageImage(selectedPackage); setPackageImageFile(null); await load(); setNotice(t('adminEquipment.imageRemoved')); }
    catch (e) { setError(errorText(e, t)); }
    finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-2xl font-bold text-[#1C2526]">{t('adminEquipment.title')}</h2><p className="mt-1 text-sm text-[#697671]">{t('adminEquipment.intro')}</p></div>
      <button type="button" className={secondaryClass} disabled={saving} onClick={onBack}><ArrowLeft className="h-4 w-4" />{t('adminEquipment.backToTours')}</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="h-4 w-4" />{notice}</div>}
    <div className="flex gap-2 border-b border-[#E6E1D8]" role="tablist" aria-label={t('adminEquipment.title')}>
      {(['equipment', 'packages'] as Tab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => { setTab(item); setError(''); setNotice(''); }} className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === item ? 'border-[#1F4E43] text-[#1F4E43]' : 'border-transparent text-[#697671] hover:text-[#1C2526]'}`}>{t(item === 'equipment' ? 'adminEquipment.equipmentTab' : 'adminEquipment.packagesTab')}</button>)}
    </div>
    {loading ? <p className="py-10 text-center text-sm text-[#697671]">{t('adminEquipment.loading')}</p> : tab === 'equipment' ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
      <section className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white"><div className="flex items-center justify-between border-b border-[#E6E1D8] p-4"><div><h3 className="font-semibold text-[#1C2526]">{t('adminEquipment.equipmentTab')}</h3><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.equipmentHelp')}</p></div><button className={secondaryClass} onClick={resetEquipment}><Plus className="h-4 w-4" />{t('adminEquipment.add')}</button></div>
        {equipment.length === 0 ? <p className="p-5 text-sm text-[#697671]">{t('adminEquipment.noEquipment')}</p> : <ul className="divide-y divide-[#F0EEE9]">{equipment.map((row) => <li key={row.id} className={`flex items-center gap-3 px-4 py-3 ${selectedEquipment === row.id ? 'bg-[#F1F6F3]' : ''}`}><button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => editEquipment(row)}><ImageThumb url={row.imageUrl} alt={row.name} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#1C2526]">{row.name}</span><span className="mt-1 block truncate text-xs text-[#697671]">{row.description || t('adminEquipment.noDescription')}</span></span></button><span className="whitespace-nowrap text-xs text-[#52605D]">{row.individualRentalPriceVnd == null ? t('adminEquipment.notForIndividualRental') : `${money.format(row.individualRentalPriceVnd)} VND / ${t('adminEquipment.perItem')}`}</span><button type="button" className="rounded-md p-2 text-[#697671] hover:bg-red-50 hover:text-red-700 disabled:opacity-50" aria-label={t('adminEquipment.delete')} disabled={saving} onClick={() => void deleteEquipment(row)}><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
      </section>
      <form className="space-y-4 rounded-2xl border border-[#E6E1D8] bg-white p-5" onSubmit={(event) => void saveEquipment(event)}><div><h3 className="font-semibold text-[#1C2526]">{selectedEquipment ? t('adminEquipment.editEquipment') : t('adminEquipment.addEquipment')}</h3><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.defaultItemPriceHelp')}</p></div>
        <label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.equipmentName')}<input required maxLength={200} className={inputClass} value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} /></label>
        <label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.description')}<textarea rows={3} className={inputClass} value={equipmentForm.description} onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })} /></label>
        <ImageField label={t('adminEquipment.image')} currentUrl={equipment.find((item) => item.id === selectedEquipment)?.imageUrl ?? null} file={equipmentImageFile} disabled={saving} onChange={(file) => chooseImage(file, setEquipmentImageFile)} onRemove={selectedEquipment ? () => void removeEquipmentImage() : undefined} removeLabel={t('adminEquipment.removeImage')} />
        <label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.defaultItemPrice')}<input type="number" min="0" step="1" className={inputClass} value={equipmentForm.price} onChange={(e) => setEquipmentForm({ ...equipmentForm, price: e.target.value })} placeholder={t('adminEquipment.noPrice')} /><span className="mt-1 block text-xs text-[#697671]">{t('adminEquipment.noPriceMeansUnavailable')}</span></label>
        <div className="flex gap-2"><button className={buttonClass} disabled={saving}><Save className="h-4 w-4" />{saving ? t('adminEquipment.saving') : t('adminEquipment.save')}</button>{selectedEquipment && <button type="button" className={secondaryClass} onClick={resetEquipment}>{t('adminEquipment.cancelEdit')}</button>}</div>
      </form>
    </div> : <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(400px,1.15fr)]">
      <section className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white"><div className="flex items-center justify-between border-b border-[#E6E1D8] p-4"><div><h3 className="font-semibold text-[#1C2526]">{t('adminEquipment.packagesTab')}</h3><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.packageHelp')}</p></div><button className={secondaryClass} onClick={resetPackage}><PackagePlus className="h-4 w-4" />{t('adminEquipment.add')}</button></div>
        {packages.length === 0 ? <p className="p-5 text-sm text-[#697671]">{t('adminEquipment.noPackages')}</p> : <ul className="divide-y divide-[#F0EEE9]">{packages.map((row) => <li key={row.id} className={`flex items-center gap-3 px-4 py-3 ${selectedPackage === row.id ? 'bg-[#F1F6F3]' : ''}`}><button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => editPackage(row)}><ImageThumb url={row.imageUrl} alt={row.title} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#1C2526]">{row.title}</span><span className="mt-1 block text-xs text-[#697671]">{row.items.length} {t('adminEquipment.itemCount')} · {money.format(row.rentalPriceVnd)} VND / {t('adminEquipment.perPackage')}</span></span></button><button type="button" className="rounded-md p-2 text-[#697671] hover:bg-red-50 hover:text-red-700 disabled:opacity-50" aria-label={t('adminEquipment.delete')} disabled={saving} onClick={() => void deletePackage(row)}><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
      </section>
      <form className="space-y-4 rounded-2xl border border-[#E6E1D8] bg-white p-5" onSubmit={(event) => void savePackage(event)}><div><h3 className="font-semibold text-[#1C2526]">{selectedPackage ? t('adminEquipment.editPackage') : t('adminEquipment.addPackage')}</h3><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.packageHelp')}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.packageName')}<input required maxLength={200} className={inputClass} value={packageForm.title} onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })} /></label><label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.packagePrice')}<input required type="number" min="0" step="1" className={inputClass} value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} /></label></div>
        <ImageField label={t('adminEquipment.image')} currentUrl={packages.find((item) => item.id === selectedPackage)?.imageUrl ?? null} file={packageImageFile} disabled={saving} onChange={(file) => chooseImage(file, setPackageImageFile)} onRemove={selectedPackage ? () => void removePackageImage() : undefined} removeLabel={t('adminEquipment.removeImage')} />
        <label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.sharedEquipment')}<textarea rows={2} className={inputClass} value={packageForm.sharedItems} onChange={(e) => setPackageForm({ ...packageForm, sharedItems: e.target.value })} /></label>
        <label className="block text-sm font-medium text-[#34413D]">{t('adminEquipment.personalItems')}<textarea rows={2} className={inputClass} value={packageForm.personalItemsToBring} onChange={(e) => setPackageForm({ ...packageForm, personalItemsToBring: e.target.value })} /></label>
        <fieldset><legend className="text-sm font-semibold text-[#1C2526]">{t('adminEquipment.packageContents')}</legend><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.packageContentsHelp')}</p>
          {equipment.length === 0 ? <p className="mt-3 rounded-lg bg-[#F7F8F6] p-3 text-sm text-[#697671]">{t('adminEquipment.createEquipmentFirst')}</p> : <ul className="mt-3 divide-y divide-[#F0EEE9] rounded-lg border border-[#E6E1D8]">{equipment.map((item) => {
            const value = packageItems[item.id] ?? { checked: false, quantity: '1', price: '' };
            return <li key={item.id} className="p-3"><div className="flex items-start gap-3"><input id={`package-equipment-${item.id}`} type="checkbox" className="mt-1 h-4 w-4 accent-[#1F4E43]" checked={value.checked} onChange={(e) => setPackageItems({ ...packageItems, [item.id]: { ...value, checked: e.target.checked } })} /><label htmlFor={`package-equipment-${item.id}`} className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#1C2526]">{item.name}</span><span className="block text-xs text-[#697671]">{item.individualRentalPriceVnd == null ? t('adminEquipment.notForIndividualRental') : `${t('adminEquipment.defaultPrice')}: ${money.format(item.individualRentalPriceVnd)} VND`}</span></label></div>
              {value.checked && <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2"><label className="text-xs font-medium text-[#52605D]">{t('adminEquipment.quantityInPackage')}<input required type="number" min="1" step="1" className={inputClass} value={value.quantity} onChange={(e) => setPackageItems({ ...packageItems, [item.id]: { ...value, quantity: e.target.value } })} /></label><label className="text-xs font-medium text-[#52605D]">{t('adminEquipment.itemRentalPrice')}<input type="number" min="0" step="1" className={inputClass} value={value.price} placeholder={item.individualRentalPriceVnd == null ? t('adminEquipment.noPrice') : `${money.format(item.individualRentalPriceVnd)} VND`} onChange={(e) => setPackageItems({ ...packageItems, [item.id]: { ...value, price: e.target.value } })} /><span className="mt-1 block font-normal">{t('adminEquipment.itemPriceHelp')}</span></label></div>}
            </li>;
          })}</ul>}
        </fieldset>
        <div className="flex gap-2"><button className={buttonClass} disabled={saving}><Save className="h-4 w-4" />{saving ? t('adminEquipment.saving') : t('adminEquipment.save')}</button>{selectedPackage && <button type="button" className={secondaryClass} onClick={resetPackage}>{t('adminEquipment.cancelEdit')}</button>}</div>
      </form>
    </div>}
  </div>;
}

function ImageField({ label, currentUrl, file, disabled, onChange, onRemove, removeLabel }: {
  label: string;
  currentUrl: string | null;
  file: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  removeLabel: string;
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = preview ?? currentUrl;
  return <div>
    <span className="block text-sm font-medium text-[#34413D]">{label}</span>
    <div className="mt-2 flex items-center gap-3">
      <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E6E1D8] bg-[#F7F8F6]">
        {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <ImageIcon aria-hidden="true" className="h-7 w-7 text-[#9AA7A1]" />}
      </div>
      <div className="min-w-0 flex-1">
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} className="block w-full text-sm text-[#52605D] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F1F6F3] file:px-3 file:py-2 file:font-semibold file:text-[#1F4E43] disabled:opacity-50" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
        <p className="mt-1 text-xs text-[#697671]">{file?.name ?? t('adminEquipment.imageLimit')}</p>
        {onRemove && currentUrl && !file && <button type="button" className="mt-1 text-xs font-semibold text-red-700 hover:underline disabled:opacity-50" disabled={disabled} onClick={onRemove}>{removeLabel}</button>}
      </div>
    </div>
  </div>;
}

function ImageThumb({ url, alt }: { url: string | null; alt: string }) {
  return <span className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F1F0EA]">
    {url ? <img src={url} alt={alt} className="h-full w-full object-cover" /> : <ImageIcon aria-hidden="true" className="h-5 w-5 text-[#9AA7A1]" />}
  </span>;
}
