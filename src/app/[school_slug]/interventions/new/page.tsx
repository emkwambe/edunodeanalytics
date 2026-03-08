'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function NewInterventionPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'academic',
    description: '',
    goal: '',
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      alert('Intervention creation coming soon');
      router.push('/' + schoolSlug + '/interventions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">New Intervention</h1>
        <p className="text-slate-400 mt-1">Create a Tier 2 or Tier 3 intervention for a student.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input type="text" required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Small Group Reading Instruction" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500">
            <option value="academic">Academic</option>
            <option value="attendance">Attendance</option>
            <option value="behavior">Behavior</option>
            <option value="sel">Social-Emotional (SEL)</option>
            <option value="family_engagement">Family Engagement</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe the intervention plan..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Goal</label>
          <input type="text" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Improve reading fluency from 85 to 120 WPM" />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading || !form.title}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {loading ? 'Creating...' : 'Create Intervention'}
          </button>
          <button type="button" onClick={() => router.push('/' + schoolSlug + '/interventions')}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}