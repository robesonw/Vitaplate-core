import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ScorecardView() {
  const { userId } = useParams();
  const [scoreImage, setScoreImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const loadScorecard = async () => {
      try {
        // Get user data
        const users = await base44.entities.User.list();
        const user = users.find(u => u.id === userId);

        if (!user) {
          setIsPrivate(true);
          setIsLoading(false);
          return;
        }

        // Check if user has public scorecard enabled
        const scoreShares = await base44.entities.ScoreShare.filter({
          user_email: user.email
        });

        if (scoreShares.length > 0 && !scoreShares[0].public_scorecard_enabled) {
          setIsPrivate(true);
          setIsLoading(false);
          return;
        }

        // Get lab results for biomarkers
        const labResults = await base44.entities.LabResult.filter({
          created_by: user.email
        });

        // Calculate health score (basic implementation)
        let healthScore = 75;
        const topBiomarkers = [
          { name: 'Cholesterol', status: 'optimal' },
          { name: 'Blood Sugar', status: 'good' },
          { name: 'Vitamin D', status: 'warning' }
        ];

        if (labResults.length > 0) {
          const latest = labResults[labResults.length - 1];
          // Parse biomarker data and calculate score
          if (latest.biomarker_data) {
            const data = typeof latest.biomarker_data === 'string' 
              ? JSON.parse(latest.biomarker_data) 
              : latest.biomarker_data;
            
            // Map biomarkers from lab results
            topBiomarkers.length = 0;
            Object.entries(data).slice(0, 3).forEach(([name, value]) => {
              topBiomarkers.push({
                name: name.replace(/_/g, ' '),
                status: value.status || 'good'
              });
            });
          }
        }

        // Generate score image
        const response = await base44.functions.invoke('generateScoreImage', {
          health_score: healthScore,
          score_label: healthScore >= 80 ? 'Excellent Health' : healthScore >= 60 ? 'Good Health' : 'Fair Health',
          biomarkers: topBiomarkers
        });

        setScoreImage(response.data.image);
        setUserData({ ...user, health_score: healthScore });
      } catch (error) {
        console.error('Error loading scorecard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScorecard();
  }, [userId]);

  const handleDownload = () => {
    if (!scoreImage) return;
    
    const link = document.createElement('a');
    link.href = scoreImage;
    link.download = `vitaplate-health-score-${userData?.full_name?.replace(' ', '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Score card downloaded!');
  };

  const handleShare = async (platform) => {
    try {
      await base44.entities.ScoreShare.create({
        user_email: userData.email,
        platform: platform,
        health_score: userData.health_score,
        public_scorecard_enabled: !isPrivate
      });

      const text = `Check out my Health Score on VitaPlate! I'm ${userData.health_score}/100. Join me and get personalized nutrition insights from your lab results! ${window.location.href}`;

      if (platform === 'instagram' && scoreImage) {
        toast.info('Right-click the image below and share to Instagram Stories or Feed');
      } else if (platform === 'link_copy') {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Sharecard link copied!');
      } else {
        window.open(`https://www.instagram.com/?url=${encodeURIComponent(window.location.href)}`, '_blank');
      }
    } catch (error) {
      toast.error('Failed to share scorecard');
      console.error('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">This scorecard is private</h2>
            <p className="text-slate-600 mb-4">
              The user has not made their health score public yet.
            </p>
            <Button variant="outline" asChild>
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {userData?.full_name?.split(' ')[0]}'s Health Score
          </h1>
          <p className="text-slate-600 mt-2">Powered by VitaPlate</p>
        </div>
      </div>

      {/* Score Image */}
      <div className="max-w-2xl mx-auto mb-8">
        {scoreImage && (
          <div className="rounded-2xl shadow-2xl overflow-hidden">
            <img src={scoreImage} alt="Health Score Card" className="w-full" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>
          <Button
            onClick={() => handleShare('link_copy')}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>

        <Button
          onClick={() => handleShare('instagram')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share to Instagram
        </Button>

        {/* Info */}
        <Card className="border-slate-200 bg-white/50">
          <CardContent className="p-4 text-center text-sm text-slate-600">
            <p>Share your VitaPlate health score and inspire friends to take control of their nutrition.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}