// Ortak arayüz parçaları
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, alpha, shadow, battColor } from './theme';
import { AY, DN, monthCells, nowYM, shiftM, today, fmtD, isDate, fmtTimeInput, parse, ymd } from './logic';

export const R = 16; // köşe yuvarlaklığı

export function T({ s = 16, w = '400', c, style, children, ...p }) {
  const t = useTheme();
  return <Text style={[{ fontSize: s, fontWeight: w, color: c || t.ink }, style]} {...p}>{children}</Text>;
}
export function Mute({ children, style, s = 14 }) {
  const t = useTheme();
  return <Text style={[{ fontSize: s, color: t.mute }, style]}>{children}</Text>;
}
export function H2({ children, style }) {
  return <T s={22} w="800" style={style}>{children}</T>;
}
export function H3({ children, style }) {
  return <T s={17} w="800" style={style}>{children}</T>;
}

// Bölüm başlığı: renkli simge rozeti + başlık + isteğe bağlı alt yazı ve sağda düğme
export function SectionHead({ icon, color, title, sub, right }) {
  const t = useTheme();
  const c = color || t.accT;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: t.soft ? 12 : 9, backgroundColor: alpha(c, t.dark ? 0.2 : 0.13), alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={c} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <T s={17} w="800">{title}</T>
        {sub ? <Text style={{ fontSize: 12.5, color: t.mute }} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {right || null}
    </View>
  );
}

export function Card({ children, style, bg, border }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: bg || t.card, borderColor: border || t.line, borderWidth: border ? Math.max(1, t.bw) : t.bw, borderRadius: t.r, padding: t.soft ? 18 : 16, gap: 10 }, bg ? null : shadow(t), style]}>
      {children}
    </View>
  );
}

export function Btn({ title, onPress, kind, sm, icon, disabled, style, color }) {
  const t = useTheme();
  const bg = kind === 'pri' ? t.acc : kind === 'ok' ? alpha(t.grn, 0.16) : kind === 'inv' ? alpha(t.accI, 0.15) : t.card;
  const fg = kind === 'pri' ? t.accI : kind === 'danger' ? t.red : kind === 'ok' ? t.grn : kind === 'inv' ? t.accI : t.ink;
  const bd = kind === 'pri' ? t.acc : kind === 'danger' ? alpha(t.red, 0.5) : kind === 'ok' ? alpha(t.grn, 0.4) : kind === 'inv' ? alpha(t.accI, 0.35) : t.line;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: sm ? 38 : 44, paddingHorizontal: sm ? 12 : 16, borderRadius: t.rb, borderWidth: 1,
        backgroundColor: color || bg, borderColor: color || bd, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6, opacity: disabled ? 0.45 : pressed ? (t.soft ? 0.9 : 0.75) : 1,
        transform: [{ scale: pressed && t.soft ? 0.96 : 1 }],
      }, style]}
    >
      {icon ? <Ionicons name={icon} size={sm ? 16 : 18} color={fg} /> : null}
      {title ? <Text style={{ color: fg, fontWeight: '700', fontSize: sm ? 14 : 15 }}>{title}</Text> : null}
    </Pressable>
  );
}

export function IconBtn({ name, onPress, label, color, size = 22, disabled }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: t.soft ? 22 : 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.card2 : 'transparent', opacity: disabled ? 0.35 : 1 })}
    >
      <Ionicons name={name} size={size} color={color || t.ink} />
    </Pressable>
  );
}

export function Chip({ label, on, onPress, color }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center',
        backgroundColor: on ? color || t.ink : t.card2, borderColor: on ? color || t.ink : t.line }}
    >
      <Text style={{ fontWeight: '700', color: on ? (color ? '#fff' : t.bg) : t.ink }}>{label}</Text>
    </Pressable>
  );
}

// Yan yana dizilen form alanları satırı paylaşsın (alt alta dizilince normal yükseklikte kalsınlar)
const ROW_FIELD = { flexGrow: 1, flexBasis: 120 };
export function Row({ children, style, wrap = true }) {
  const kids = React.Children.map(children, (c) =>
    React.isValidElement(c) && (c.type === Field || c.type === DateField || c.type === TimeField)
      ? React.cloneElement(c, { style: [ROW_FIELD, c.props.style] })
      : c);
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{kids}</View>;
}

export function Field({ label, style, inputStyle, ...p }) {
  const t = useTheme();
  return (
    <View style={[{ gap: 5 }, style]}>
      {label ? <Text style={{ fontSize: 14, fontWeight: '700', color: t.mute }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.mute}
        style={[{ minHeight: 44, fontSize: 16, borderRadius: t.rs, borderWidth: 1, borderColor: t.line, backgroundColor: t.card2, paddingHorizontal: 12, color: t.ink }, inputStyle]}
        {...p}
      />
    </View>
  );
}

export function TimeField({ label, value, onChange, style }) {
  return (
    <Field
      label={label}
      value={value || ''}
      onChangeText={(v) => onChange(fmtTimeInput(v))}
      placeholder="SS:DD"
      keyboardType="number-pad"
      maxLength={5}
      style={style}
    />
  );
}

export function DateField({ label, value, onChange, style, allowClear = true }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const start = isDate(value) ? parse(value) : new Date();
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  return (
    <View style={[{ gap: 5 }, style]}>
      {label ? <Text style={{ fontSize: 14, fontWeight: '700', color: t.mute }}>{label}</Text> : null}
      <Pressable
        onPress={() => { const d = isDate(value) ? parse(value) : new Date(); setYm({ y: d.getFullYear(), m: d.getMonth() }); setOpen(true); }}
        style={{ minHeight: 44, borderRadius: t.rs, borderWidth: 1, borderColor: t.line, backgroundColor: t.card2, paddingHorizontal: 12, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 16, color: isDate(value) ? t.ink : t.mute }}>{isDate(value) ? fmtD(value) + ' ' + parse(value).getFullYear() : 'Tarih seç'}</Text>
      </Pressable>
      <Sheet visible={open} title={label || 'Tarih seç'} onClose={() => setOpen(false)}>
        <MonthView
          y={ym.y} m={ym.m}
          onShift={(d) => setYm(shiftM(ym, d))}
          renderCell={(d) => {
            const sel = d === value, td = d === today();
            return (
              <Pressable key={d} onPress={() => { onChange(d); setOpen(false); }} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? t.acc : 'transparent', borderWidth: td && !sel ? 2 : 0, borderColor: t.ink }}>
                  <Text style={{ fontWeight: '700', color: sel ? t.accI : t.ink }}>{+d.slice(8)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
        <Row>
          <Btn sm title="Bugün" onPress={() => { onChange(today()); setOpen(false); }} />
          <Btn sm title="Yarın" onPress={() => { const d = new Date(); d.setDate(d.getDate() + 1); onChange(ymd(d)); setOpen(false); }} />
          {allowClear ? <Btn sm title="Temizle" onPress={() => { onChange(''); setOpen(false); }} /> : null}
        </Row>
      </Sheet>
    </View>
  );
}

export function Seg({ options, value, onChange, label }) {
  const t = useTheme();
  return (
    <View style={{ gap: 5 }}>
      {label ? <Text style={{ fontSize: 14, fontWeight: '700', color: t.mute }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map(([v, l, col]) => {
          const on = v === value;
          return (
            <Pressable
              key={String(v)}
              onPress={() => onChange(v)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={{ flex: 1, minHeight: 44, borderRadius: t.rs, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
                backgroundColor: on ? col || t.acc : t.card, borderColor: on ? col || t.acc : t.line }}
            >
              <Text style={{ fontWeight: '800', fontSize: 14, textAlign: 'center', color: on ? (col === t.yel ? '#221a00' : col ? '#fff' : t.accI) : t.ink }}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ColorPick({ colors, value, onChange, label = 'Renk' }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: t.mute }}>{label}</Text>
      <Row>
        {colors.map((c) => (
          <Pressable key={c} onPress={() => onChange(c)} accessibilityLabel={'Renk ' + c}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c, borderWidth: 3, borderColor: value === c ? t.ink : 'transparent' }} />
        ))}
      </Row>
    </View>
  );
}

export function DayPick({ value, onChange }) {
  const t = useTheme();
  const toggle = (i) => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort());
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: t.mute }}>Günler</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DN.map((d, i) => {
          const on = value.includes(i);
          return (
            <Pressable key={d} onPress={() => toggle(i)} accessibilityState={{ checked: on }}
              style={{ flex: 1, minHeight: 44, borderRadius: t.rs, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.acc : t.card, borderColor: on ? t.acc : t.line }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: on ? t.accI : t.ink }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <Row>
        <Btn sm title="Her gün" onPress={() => onChange([0, 1, 2, 3, 4, 5, 6])} />
        <Btn sm title="Hafta içi" onPress={() => onChange([0, 1, 2, 3, 4])} />
        <Btn sm title="Hafta sonu" onPress={() => onChange([5, 6])} />
      </Row>
    </View>
  );
}

// Açma–kapama düğmesi (tik kutusu yerine)
export function Switch({ value, onChange, label, color, disabled }) {
  const t = useTheme();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: Platform.OS !== 'web', speed: 22, bounciness: 6 }).start();
  }, [value]);
  const on = color || t.acc;
  return (
    <Pressable onPress={() => !disabled && onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: !!value, disabled: !!disabled }} accessibilityLabel={label} hitSlop={8}
      style={{ width: 56, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: value ? on : t.off, justifyContent: 'center' }}>
        <Animated.View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginLeft: 3,
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
          ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }, default: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } }) }} />
      </View>
    </Pressable>
  );
}

// Etiket solda, switch sağda (eski tik kutusunun yerine)
export function Check({ label, value, onChange, sub }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: !!value }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <T w="600">{label}</T>
        {sub ? <Text style={{ fontSize: 13, color: t.mute }}>{sub}</Text> : null}
      </View>
      <Switch value={!!value} onChange={onChange} label={label} />
    </Pressable>
  );
}

// Telefonun şarj simgesi gibi ilerleme pili. pct 0–100+
export function Battery({ pct, w = 120, h = 54, label, showText = true }) {
  const t = useTheme();
  const p = Math.max(0, Math.min(100, pct || 0));
  const c = battColor(t, p);
  const bw = Math.max(2, Math.round(h / 16));
  const pad = Math.max(2, Math.round(h / 14));
  const nubW = Math.max(4, Math.round(w / 22)), nubH = Math.round(h * 0.42);
  const full = (pct || 0) >= 100;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={(label ? label + ': ' : '') + '%' + Math.round(pct || 0)} accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
      style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: w, height: h, borderRadius: Math.round(h / 4), borderWidth: bw, borderColor: alpha(t.ink, 0.8), padding: pad, justifyContent: 'center' }}>
        <View style={{ width: p + '%', height: '100%', borderRadius: Math.max(2, Math.round(h / 6) - pad), backgroundColor: c, minWidth: p > 0 ? 3 : 0 }} />
        {/* parlama çizgisi */}
        {p > 8 ? <View style={{ position: 'absolute', left: pad + 4, top: pad + 3, width: Math.max(0, (w - 2 * pad - 2 * bw) * p / 100 - 10), height: Math.max(2, h / 10), borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' }} /> : null}
        {showText ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            {full ? <Text style={{ fontSize: h * 0.34, color: '#fff' }}>⚡</Text> : null}
            <Text style={{ fontSize: Math.max(11, h * 0.34), fontWeight: '800', fontVariant: ['tabular-nums'], color: p >= 45 ? '#fff' : t.ink,
              ...(p >= 45 ? { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } } : null) }}>
              {'%' + Math.floor(pct || 0)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ width: nubW, height: nubH, marginLeft: 2, borderTopRightRadius: nubW, borderBottomRightRadius: nubW, backgroundColor: alpha(t.ink, 0.8) }} />
    </View>
  );
}

export function Bar({ pct, color, h = 10 }) {
  const t = useTheme();
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: t.card2, overflow: 'hidden' }}>
      <View style={{ width: Math.max(0, Math.min(100, pct)) + '%', height: '100%', borderRadius: h, backgroundColor: color || t.acc }} />
    </View>
  );
}

export function Empty({ text }) {
  return <Mute s={14.5} style={{ paddingVertical: 6 }}>{text}</Mute>;
}

export function ListRow({ children, last }) {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderColor: t.line }}>{children}</View>;
}

// Ay görünümü: renderCell(tarih, sütun) bir hücre döndürür
export function MonthView({ y, m, onShift, renderCell, title, emptyCell }) {
  const t = useTheme();
  const cells = monthCells(y, m);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <IconBtn name="chevron-back" label="Önceki ay" onPress={() => onShift(-1)} />
        <T s={17} w="800" style={{ textAlign: 'center', flex: 1 }}>{title || AY[m] + ' ' + y}</T>
        <IconBtn name="chevron-forward" label="Sonraki ay" onPress={() => onShift(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {DN.map((d) => <Text key={d} style={{ width: '14.2857%', textAlign: 'center', fontSize: 12.5, fontWeight: '800', color: t.mute, paddingVertical: 4 }}>{d}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => (
          <View key={d || 'e' + i} style={{ width: '14.2857%' }}>
            {d ? renderCell(d, i % 7) : emptyCell ? emptyCell(i) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

// Alttan açılan form penceresi
export function Sheet({ visible, title, onClose, children, footer }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const wide = width > 640;
  return (
    <Modal visible={visible} transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(8,10,13,0.55)', justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center', padding: wide ? 16 : 0 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 540, maxHeight: '92%', backgroundColor: t.card, borderTopLeftRadius: t.r + 2, borderTopRightRadius: t.r + 2, borderBottomLeftRadius: wide ? t.r + 2 : 0, borderBottomRightRadius: wide ? t.r + 2 : 0, borderWidth: 1, borderColor: t.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12 }}>
              <T s={18} w="800" style={{ flex: 1 }}>{title}</T>
              <IconBtn name="close" label="Kapat" onPress={onClose} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, gap: 12, paddingBottom: footer ? 12 : 28 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={{ paddingHorizontal: 18, paddingBottom: 24, paddingTop: 4 }}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Duyarlı ızgara: genişliğe göre sütun sayısı
export function Grid({ min = 310, children, gap = 14 }) {
  const { width } = useWindowDimensions();
  const avail = Math.min(width, 1120) - 32;
  const cols = Math.max(1, Math.floor((avail + gap) / (min + gap)));
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2, rowGap: gap }}>
      {items.map((c, i) => <View key={i} style={{ width: 100 / cols + '%', paddingHorizontal: gap / 2 }}>{c}</View>)}
    </View>
  );
}

// ---------- bildirim baloncuğu ve onay penceresi ----------
const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }) {
  const t = useTheme();
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const [ask, setAsk] = useState(null);
  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2800);
  }, []);
  const confirm = useCallback((text, onYes, yesLabel = 'Sil') => setAsk({ text, onYes, yesLabel }), []);
  return (
    <UICtx.Provider value={{ toast, confirm }}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 40, alignItems: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: t.ink, paddingVertical: 12, paddingHorizontal: 18, borderRadius: t.soft ? 999 : 12, maxWidth: 520 }}>
            <Text style={{ color: t.bg, fontWeight: '700', textAlign: 'center' }}>{msg}</Text>
          </View>
        </View>
      ) : null}
      <Sheet visible={!!ask} title="Emin misin?" onClose={() => setAsk(null)}>
        <T s={17} w="700">{ask ? ask.text : ''}</T>
        <Row style={{ justifyContent: 'flex-end' }}>
          <Btn title="Vazgeç" onPress={() => setAsk(null)} />
          <Btn title={ask ? ask.yesLabel : 'Sil'} kind="danger" onPress={() => { const f = ask && ask.onYes; setAsk(null); if (f) f(); }} />
        </Row>
      </Sheet>
    </UICtx.Provider>
  );
}

// Formların altındaki Vazgeç / Kaydet
export function FormFooter({ onCancel, onSave, saveLabel = 'Kaydet' }) {
  return (
    <Row style={{ justifyContent: 'flex-end' }}>
      <Btn title="Vazgeç" onPress={onCancel} />
      <Btn title={saveLabel} kind="pri" onPress={onSave} />
    </Row>
  );
}
