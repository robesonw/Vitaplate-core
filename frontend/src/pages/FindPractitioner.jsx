import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Phone, Search, Loader2 } from 'lucide-react';

export default function FindPractitioner() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');

  const { data: practitioners = [], isLoading } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const apps = await base44.entities.PractitionerApplication.filter({
        status: 'approved',
        show_in_directory: true
      });
      return apps;
    }
  });

  const filteredPractitioners = practitioners.filter(p => {
    const matchLocation = !searchLocation || 
      p.practice_location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchProfession = !selectedProfession || 
      p.profession === selectedProfession;
    return matchLocation && matchProfession;
  });

  const professions = [
    { value: 'registered_dietitian', label: 'Registered Dietitian' },
    { value: 'nutritionist', label: 'Nutritionist' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
    { value: 'health_coach', label: 'Health Coach' },
    { value: 'wellness_consultant', label: 'Wellness Consultant' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Find a VitaPlate Practitioner
          </h1>
          <p className="text-lg text-slate-600">
            Discover healthcare professionals recommending VitaPlate in your area
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Filters */}
        <Card className="mb-8 border-slate-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Location Search */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Location (City, State)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="e.g., New York, NY"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Profession Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Profession Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Button
                    variant={!selectedProfession ? 'default' : 'outline'}
                    onClick={() => setSelectedProfession('')}
                    className="justify-start"
                  >
                    All Professionals
                  </Button>
                  {professions.map(prof => (
                    <Button
                      key={prof.value}
                      variant={selectedProfession === prof.value ? 'default' : 'outline'}
                      onClick={() => setSelectedProfession(prof.value)}
                      className="justify-start"
                    >
                      {prof.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredPractitioners.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No practitioners found</h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search or check back soon as we add more practitioners to the network.
              </p>
              <Button asChild variant="outline">
                <a href="/practitioners">Become a Practitioner</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Found <strong>{filteredPractitioners.length}</strong> practitioner{filteredPractitioners.length !== 1 ? 's' : ''}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredPractitioners.map(practitioner => (
                <Card key={practitioner.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{practitioner.full_name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {professions.find(p => p.value === practitioner.profession)?.label}
                        </p>
                      </div>
                      {practitioner.license_number && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Bio */}
                    {practitioner.bio && (
                      <p className="text-sm text-slate-700">
                        {practitioner.bio}
                      </p>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {practitioner.practice_location}
                      {practitioner.practice_name && (
                        <span className="text-slate-500">• {practitioner.practice_name}</span>
                      )}
                    </div>

                    {/* Specialties */}
                    {practitioner.specialties && practitioner.specialties.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {practitioner.specialties.slice(0, 3).map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {practitioner.specialties.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{practitioner.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      {practitioner.phone && (
                        <a href={`tel:${practitioner.phone}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                          <Phone className="w-4 h-4" />
                          {practitioner.phone}
                        </a>
                      )}
                      {practitioner.website && (
                        <a href={practitioner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                          <Globe className="w-4 h-4" />
                          Visit Website
                        </a>
                      )}
                      <a href={`mailto:${practitioner.email}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                        <span>Contact</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <Card className="mt-12 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Are you a healthcare professional?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Join our practitioner network and start earning commissions by recommending VitaPlate to your patients.
              </p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8">
                <a href="/practitioners">Apply Now</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}