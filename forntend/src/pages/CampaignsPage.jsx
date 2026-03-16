import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { campaignAPI } from '../services/api';
import toast from 'react-hot-toast';

const CampaignsPage = () => {
  const { user } = useAuth();
  
  // In bypass mode, infer admin role if `user?.role` isn't available but `sessionStorage` has 'admin'
  const role = user?.role || sessionStorage.getItem('bypassRole');
  const isAdmin = role === 'admin';

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    try {
      const res = await campaignAPI.getAll();
      setCampaigns(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', donationGoal: '', pickupGoal: '', endDate: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await campaignAPI.create(newCampaign);
      toast.success('Campaign launched successfully!');
      setShowModal(false);
      setNewCampaign({ name: '', description: '', donationGoal: '', pickupGoal: '', endDate: '' });
      loadCampaigns(); // Refresh list to get new DB assigned ID and metadata
    } catch (error) {
      toast.error('Error creating campaign. ' + (error.response?.data?.error || ''));
    }
  };

  const calculateProgress = (current, goal) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  return (
    <div className="page-container animate-fadeUp" style={{ paddingBottom: '4rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: "var(--color-primary-dark)", fontWeight: 800, letterSpacing: '-0.5px' }}>Active Campaigns 🎯</h1>
          <p style={{ color: "var(--text-muted)", marginTop: '0.5rem', fontSize: '1.1rem', maxWidth: '600px' }}>
            Track our community-driven initiatives. Participate in campaigns to hit specific donation and pickup goals.
          </p>
        </div>

        {/* Admin Create Button */}
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '50px', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}
            onMouseOver={e=>e.currentTarget.style.transform='scale(1.03)'} 
            onMouseOut={e=>e.currentTarget.style.transform='none'}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> Create Campaign
          </button>
        )}
      </div>

      {/* Campaign List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading active campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}>No Active Campaigns</h3>
          <p style={{ color: 'var(--text-muted)' }}>Check back later or check in with an Admin to start a new drive!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {campaigns.map(camp => {
            const donationPct = calculateProgress(camp.donationCurrent, camp.donationGoal);
            const pickupPct = calculateProgress(camp.pickupCurrent, camp.pickupGoal);

            return (
              <div key={camp._id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {/* Banner Area */}
              <div style={{ height: '140px', background: camp.image, padding: '2rem', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', color: 'white', padding: '6px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800 }}>
                  Ends {camp.endDate}
                </div>
                <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.1)', margin: 0 }}>
                  {camp.name}
                </h2>
              </div>

              {/* Content Area */}
              <div style={{ padding: '2rem' }}>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  {camp.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                  
                  {/* Donation Tracker */}
                  <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>🍱 Meals Donated</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>{donationPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: '#dcfce7', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${donationPct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '10px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: '#0f172a' }}>{camp.donationCurrent}</span> / {camp.donationGoal} meals
                    </div>
                  </div>

                  {/* Pickup Tracker */}
                  <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '0.95rem' }}>🚴 Pickups Completed</span>
                      <span style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '0.95rem' }}>{pickupPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: '#dbeafe', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pickupPct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: '10px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: '#0f172a' }}>{camp.pickupCurrent}</span> / {camp.pickupGoal} routes
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Admin Creation Modal */}
      {showModal && isAdmin && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1050 }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2.5rem', borderRadius: '24px', zIndex: 1060, width: '90%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} className="animate-fadeUp">
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '1.5rem', fontWeight: 900 }}>Create Campaign ✨</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Campaign Title</label>
                <input className="form-control" required value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} placeholder="e.g., Summer Food Drive" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Description</label>
                <textarea className="form-control" required rows="3" value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} placeholder="What is the goal of this campaign?" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Donation Goal (Meals)</label>
                  <input type="number" className="form-control" required value={newCampaign.donationGoal} onChange={e => setNewCampaign({...newCampaign, donationGoal: parseInt(e.target.value)})} min="1" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Pickup Goal (Routes)</label>
                  <input type="number" className="form-control" required value={newCampaign.pickupGoal} onChange={e => setNewCampaign({...newCampaign, pickupGoal: parseInt(e.target.value)})} min="1" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>End Date</label>
                <input className="form-control" required value={newCampaign.endDate} onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})} placeholder="e.g., Nov 30, 2023" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'transparent', fontWeight: 800, color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'var(--color-primary-dark)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Launch 🚀</button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
};

export default CampaignsPage;
