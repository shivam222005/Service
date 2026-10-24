import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Zap, 
  Droplets, 
  PhoneCall, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Wrench, 
  MapPin, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api.js';
import { EmergencyIncidentType, EmergencyRequest, User } from '../types.js';

interface EmergencyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate?: (tab: string, meta?: any) => void;
}

type Step = 'SELECT_CATEGORY' | 'SAFETY_FIRST' | 'REPAIR_REQUEST' | 'REQUEST_TRACKER';

interface IncidentInfo {
  type: EmergencyIncidentType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  helpline: { name: string; number: string; note: string };
  secondaryHelpline?: { name: string; number: string; note: string };
  instructions: { title: string; desc: string; danger?: boolean }[];
  repairEligible: boolean;
  repairDisclaimer: string;
}

const INCIDENT_DEFINITIONS: Record<EmergencyIncidentType, IncidentInfo> = {
  LPG_LEAK: {
    type: 'LPG_LEAK',
    title: 'Suspected LPG Gas Leakage',
    subtitle: 'High Explosion Risk · Prioritize Evacuation & Ventilation',
    icon: Flame,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    severity: 'CRITICAL',
    helpline: {
      name: 'All-India 24x7 LPG Emergency Helpline',
      number: '1906',
      note: 'Dedicated national LPG leak helpline across Indian Oil, Bharat Gas & HP Gas.'
    },
    secondaryHelpline: {
      name: 'National Emergency / Police / Fire',
      number: '112',
      note: 'If gas smell is intense, fire is present, or building requires evacuation.'
    },
    instructions: [
      {
        title: 'DO NOT ignite any flame or smoke',
        desc: 'Never light matches, candles, lighters, or mosquito coils anywhere near the area.',
        danger: true
      },
      {
        title: 'DO NOT operate ANY electrical switches or appliances',
        desc: 'Do NOT turn on or off lights, ceiling fans, doorbells, or mobile chargers. A tiny spark inside the switch can trigger a gas vapor explosion.',
        danger: true
      },
      {
        title: 'Leave the affected area immediately',
        desc: 'Alert all family members, children, and pets to step outside to open fresh air immediately.'
      },
      {
        title: 'DO NOT attempt DIY repairs or valve tampering',
        desc: 'Avoid attempting to locate the leak with soap water or tightening regulator valves in unsafe unventilated areas.'
      },
      {
        title: 'Open doors and windows ONLY IF safely accessible',
        desc: 'If passing by windows while exiting safely, open them to allow cross-ventilation. Do not linger.'
      }
    ],
    repairEligible: true,
    repairDisclaimer: 'Call LPG Helpline 1906 first. Once the leak is officially secured and the area is declared safe, you may request an approved gas stove/pipe technician for replacement parts.'
  },

  ELECTRICAL_HAZARD: {
    type: 'ELECTRICAL_HAZARD',
    title: 'Electrical Sparking or Burning Smell',
    subtitle: 'Shock & Fire Hazard · Isolate Power Safely',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    severity: 'HIGH',
    helpline: {
      name: 'National Emergency Response Helpline',
      number: '112',
      note: 'If visible flames, continuous arcing, or meter box fire is observed.'
    },
    secondaryHelpline: {
      name: 'Fire Service Helpline',
      number: '101',
      note: 'Direct line to municipal/district fire rescue.'
    },
    instructions: [
      {
        title: 'DO NOT touch sparking wires or smoking appliances',
        desc: 'Keep children and pets away. High voltage arcing can jump across moisture and air gaps.',
        danger: true
      },
      {
        title: 'NEVER use water on an electrical fire or spark',
        desc: 'Water conducts electricity and creates lethal electrocution risks.',
        danger: true
      },
      {
        title: 'Switch off the main MCB breaker ONLY if safe',
        desc: 'Only flip the main switch if the distribution board is dry, free of smoke, and accessible without walking on wet flooring.'
      },
      {
        title: 'Evacuate if burning plastic smell or smoke spreads',
        desc: 'Toxic PVC smoke from overheating cables is dangerous. Step outside into open air.'
      }
    ],
    repairEligible: true,
    repairDisclaimer: 'After isolating the power or ensuring safety, you can request an approved certified wireman to inspect breaker panels, wiring shorts, or damaged sockets.'
  },

  WATER_LEAK: {
    type: 'WATER_LEAK',
    title: 'Burst Pipe or Severe Water Flooding',
    subtitle: 'Flooding & Structural Risk · Isolate Main Water Supply',
    icon: Droplets,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    severity: 'HIGH',
    helpline: {
      name: 'City / District Emergency Helpline',
      number: '112',
      note: 'If water has reached live electrical panels or basement flooding creates danger.'
    },
    instructions: [
      {
        title: 'DO NOT touch electrical sockets or switches near standing water',
        desc: 'Water pooling near baseboard plugs or appliances carries severe shock hazards.',
        danger: true
      },
      {
        title: 'Shut off the main water valve / overhead tank line',
        desc: 'Locate your home or flat inlet stopcock or overhead tank gate valve and turn it clockwise until fully closed.'
      },
      {
        title: 'Avoid entering deeply flooded rooms',
        desc: 'Do not step into submerged areas until the main electricity breaker for that floor is turned off safely.'
      },
      {
        title: 'Protect valuable documents and ground items',
        desc: 'Move electronics and important items to elevated dry surfaces if safe to do so.'
      }
    ],
    repairEligible: true,
    repairDisclaimer: 'Once the main water supply is turned off, request an emergency licensed plumber to replace burst pipes, repair elbows, or unblock main drains.'
  },

  FIRE_SMOKE: {
    type: 'FIRE_SMOKE',
    title: 'Active Fire or Heavy Smoke',
    subtitle: 'Life Threatening · Evacuate Immediately · Call 101 / 112',
    icon: ShieldAlert,
    color: 'text-red-700 bg-red-50 border-red-200',
    severity: 'CRITICAL',
    helpline: {
      name: 'National Fire Services Helpline',
      number: '101',
      note: 'Immediate dispatch for fire tenders and rescue teams.'
    },
    secondaryHelpline: {
      name: 'All-in-One National Emergency Helpline',
      number: '112',
      note: '24x7 unified emergency response for police, ambulance, and disaster rescue.'
    },
    instructions: [
      {
        title: 'EVACUATE IMMEDIATELY — DO NOT DELAY',
        desc: 'Leave the premises at once. Do NOT pause to collect money, electronics, or personal belongings.',
        danger: true
      },
      {
        title: 'DO NOT use elevators or lifts during a fire',
        desc: 'Always take stairs. Power failure can trap occupants inside elevator shafts.',
        danger: true
      },
      {
        title: 'Stay low under smoke while escaping',
        desc: 'Smoke and lethal carbon monoxide rise. Crawl on hands and knees where breathable air remains.'
      },
      {
        title: 'Close doors behind you as you exit',
        desc: 'Closed doors slow down the oxygen feed and flame propagation between rooms.'
      },
      {
        title: 'Alert neighbors and call 101 or 112 from safe outside distance',
        desc: 'Do not re-enter the burning structure under ANY circumstance.'
      }
    ],
    repairEligible: false,
    repairDisclaimer: 'ServiceHub DOES NOT dispatch firefighters. This platform is strictly for subsequent post-incident cleaning and damage repair after government authorities declare the building safe.'
  },

  OTHER_URGENT: {
    type: 'OTHER_URGENT',
    title: 'Other Urgent Household Incident',
    subtitle: 'Broken Locks, Collapsed Fixture, Inverter Malfunction',
    icon: AlertTriangle,
    color: 'text-slate-800 bg-slate-50 border-slate-200',
    severity: 'MODERATE',
    helpline: {
      name: 'National Emergency Response Helpline',
      number: '112',
      note: 'For urgent safety threats or immediate danger.'
    },
    instructions: [
      {
        title: 'Assess if anyone is injured or in immediate danger',
        desc: 'If injuries or structural danger exist, call 112 or local ambulance immediately.'
      },
      {
        title: 'Cordon off the hazardous area',
        desc: 'Prevent children, elderly, and pets from entering the affected room or broken fixture area.'
      },
      {
        title: 'Do not force jammed high-tension mechanisms',
        desc: 'Avoid using improvised crowbars on pressurized lines or complex locking cylinders.'
      }
    ],
    repairEligible: true,
    repairDisclaimer: 'You can request an approved verified technician for rapid assessment and urgent repair.'
  }
};

export const EmergencyHelpModal: React.FC<EmergencyHelpModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate
}) => {
  const [step, setStep] = useState<Step>('SELECT_CATEGORY');
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncidentType | null>(null);
  
  // Repair request form state (accessible to guests without forced login)
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Active tracked request
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (!activeRequest) {
        setStep('SELECT_CATEGORY');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentInfo = selectedIncident ? INCIDENT_DEFINITIONS[selectedIncident] : null;

  const handleSelectIncident = (type: EmergencyIncidentType) => {
    setSelectedIncident(type);
    setStep('SAFETY_FIRST');
  };

  const handleProceedToRepair = () => {
    if (!currentInfo?.repairEligible) {
      return;
    }
    setStep('REPAIR_REQUEST');
  };

  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedIncident) return;

    if (!customerName.trim() || !customerPhone.trim() || !address.trim() || !district.trim() || !description.trim()) {
      setErrorMsg('Please complete all required fields: name, phone, address, district, and incident description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.emergency.createRequest({
        incident_type: selectedIncident,
        title: currentInfo?.title,
        description: description.trim(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim(),
        district: district.trim(),
        pincode: pincode.trim() || undefined
      });

      setActiveRequest(res.emergency_request);
      setStep('REQUEST_TRACKER');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit urgent repair request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshTracked = async () => {
    if (!activeRequest) return;
    try {
      const updated = await api.emergency.getById(activeRequest.id);
      setActiveRequest(updated);
    } catch (e) {
      // ignore transient refresh failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent Header Banner */}
        <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-red-800 text-red-100 px-2 py-0.5 rounded">
                  Safety Protocol Active
                </span>
                <span className="text-xs text-red-200 font-mono">24x7 Assistance</span>
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">Home Emergency Help & Guidance</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close emergency modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 'SELECT_CATEGORY' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Select the Incident Category
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Immediate safety instructions and official helpline contacts will appear on the next screen without requiring login.
                </p>
              </div>

              {/* Official Helplines Quick Banner */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-red-900 block">Immediate Life Threat or Fire?</span>
                  <span className="text-red-700">Evacuate the structure and dial national emergency services right now.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold font-mono tracking-wide shadow-xs cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call 112
                  </a>
                  <a
                    href="tel:1906"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold font-mono tracking-wide shadow-xs cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    LPG 1906
                  </a>
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {Object.values(INCIDENT_DEFINITIONS).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleSelectIncident(item.type)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3.5 hover:shadow-md ${
                        item.severity === 'CRITICAL'
                          ? 'border-red-200 hover:border-red-400 bg-red-50/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SAFETY-FIRST SCREEN (Zero Blockers, Official Numbers, Concise Rules) */}
          {step === 'SAFETY_FIRST' && currentInfo && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep('SELECT_CATEGORY')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Categories
              </button>

              {/* Title & Severity */}
              <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      currentInfo.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {currentInfo.severity} INCIDENT
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Safety Instructions First</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">{currentInfo.title}</h3>
                  <p className="text-xs text-slate-500">{currentInfo.subtitle}</p>
                </div>
              </div>

              {/* Official Helplines (Prominent Action Box) */}
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-red-600" />
                    Official Emergency Helpline
                  </span>
                  <span className="text-[11px] text-red-700 font-mono">Toll Free 24/7</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-red-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{currentInfo.helpline.name}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{currentInfo.helpline.note}</span>
                  </div>
                  <a
                    href={`tel:${currentInfo.helpline.number}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold font-mono text-sm tracking-wide shadow-xs shrink-0 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call {currentInfo.helpline.number}
                  </a>
                </div>

                {currentInfo.secondaryHelpline && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-red-100 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{currentInfo.secondaryHelpline.name}</span>
                      <span className="text-[11px] text-slate-500 block">{currentInfo.secondaryHelpline.note}</span>
                    </div>
                    <a
                      href={`tel:${currentInfo.secondaryHelpline.number}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-mono font-bold text-xs shrink-0 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Dial {currentInfo.secondaryHelpline.number}
                    </a>
                  </div>
                )}
              </div>

              {/* Authoritative Safety Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Mandatory Immediate Actions
                </h4>
                <div className="space-y-2.5">
                  {currentInfo.instructions.map((inst, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                        inst.danger
                          ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                        inst.danger ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <strong className="font-bold block text-xs">{inst.title}</strong>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{inst.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notice Regarding ServiceHub Marketplace */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Notice: Marketplace Technicians vs. Official Dispatches</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  {currentInfo.repairDisclaimer}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  I Am In A Safe Location Now (Close)
                </button>

                {currentInfo.repairEligible && (
                  <button
                    type="button"
                    onClick={handleProceedToRepair}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Request Marketplace Repair</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONAL MARKETPLACE REPAIR REQUEST */}
          {step === 'REPAIR_REQUEST' && currentInfo && (
            <form onSubmit={handleSubmitRepair} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep('SAFETY_FIRST')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Safety Instructions
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    Marketplace Request
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Step 2 of 2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Request Urgent Independent Specialist Assistance
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter details to alert approved local specialists in your district. No upfront payment required.
                </p>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                <strong>Disclaimer:</strong> This requests assistance from vetted independent tradespeople. It does not replace official emergency services. A technician is only dispatched once an approved specialist accepts your request.
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98220 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District / City *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune, Lucknow, Varanasi, Baramati"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postal PIN Code (6 Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 411001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1">Address / Landmark *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat/House No., Building Name, Street, Landmark"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1">
                  Incident Description & Immediate Situation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem, e.g. 'Main overhead tank pipe cracked; water valve turned off; need emergency plumber to replace coupling.'"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('SAFETY_FIRST')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Alerting Local Specialists...' : 'Submit Urgent Marketplace Request'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: REAL-TIME REQUEST TRACKER */}
          {step === 'REQUEST_TRACKER' && activeRequest && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-emerald-950">
                    Urgent Repair Request #{activeRequest.id} Broadcasted
                  </h4>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Local verified trade specialists in <strong>{activeRequest.district}</strong> have been notified. Once an approved technician accepts, their contact details will appear below.
                  </p>
                </div>
              </div>

              {/* Status Indicator Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-mono block">Current Status</span>
                    <span className={`inline-block font-bold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-full mt-1 ${
                      activeRequest.status === 'ACCEPTED' || activeRequest.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : activeRequest.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeRequest.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefreshTracked}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Refresh Status
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Incident Category</span>
                    <span className="font-semibold">{activeRequest.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="font-semibold">{activeRequest.address}, {activeRequest.district}</span>
                  </div>
                </div>

                {/* Assigned Specialist Details (Appears only upon real acceptance) */}
                {activeRequest.assigned_provider_name ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Technician Assigned & On Alert</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-800">
                      <p><strong>Specialist:</strong> {activeRequest.assigned_provider_name}</p>
                      {activeRequest.assigned_provider_business && (
                        <p><strong>Business:</strong> {activeRequest.assigned_provider_business}</p>
                      )}
                      {activeRequest.assigned_provider_phone && (
                        <p className="flex items-center gap-1.5 pt-1">
                          <strong>Direct Phone:</strong>
                          <a
                            href={`tel:${activeRequest.assigned_provider_phone}`}
                            className="font-mono font-bold text-blue-600 hover:underline"
                          >
                            {activeRequest.assigned_provider_phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-slate-500 text-[11px]">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                    <span>Waiting for eligible local professional to review and accept the request...</span>
                  </div>
                )}
              </div>

              {/* Close & Return Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(null);
                    setStep('SELECT_CATEGORY');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Submit Another Emergency Request
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
