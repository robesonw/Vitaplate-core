import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Flame, Target } from 'lucide-react';

export default function Analytics() {
  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list(),
  });

  // Calculate macronutrient distribution across all plans
  const macroDistribution = React.useMemo(() => {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    mealPlans.forEach(plan => {
      if (plan.macros) {
        totalProtein += plan.macros.protein || 0;
        totalCarbs += plan.macros.carbs || 0;
        totalFat += plan.macros.fat || 0;
      } else {
        plan.days?.forEach(day => {
          ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
            const meal = day[mealType];
            if (meal) {
              totalProtein += meal.protein || 0;
              totalCarbs += meal.carbs || 0;
              totalFat += meal.fat || 0;
            }
          });
        });
      }
    });
    
    const total = totalProtein + totalCarbs + totalFat;
    return total > 0 ? [
      { name: 'Protein', value: totalProtein, percentage: Math.round((totalProtein / total) * 100) },
      { name: 'Carbs', value: totalCarbs, percentage: Math.round((totalCarbs / total) * 100) },
      { name: 'Fat', value: totalFat, percentage: Math.round((totalFat / total) * 100) }
    ] : [];
  }, [mealPlans]);

  // Calculate cultural style distribution
  const culturalDistribution = React.useMemo(() => {
    const styles = {};
    mealPlans.forEach(plan => {
      const style = plan.cultural_style && plan.cultural_style !== 'none' 
        ? plan.cultural_style.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Mixed';
      styles[style] = (styles[style] || 0) + 1;
    });
    return Object.entries(styles).map(([name, value]) => ({ name, value }));
  }, [mealPlans]);

  const pieData = culturalDistribution;

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];
  const MACRO_COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  // Calculate actual weekly trend based on creation dates
  const weeklyData = React.useMemo(() => {
    const weeks = {};
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    mealPlans.forEach(plan => {
      const planDate = new Date(plan.created_date).getTime();
      const weeksAgo = Math.floor((now - planDate) / weekMs);
      const weekLabel = weeksAgo === 0 ? 'This Week' : 
                       weeksAgo === 1 ? 'Last Week' :
                       weeksAgo <= 4 ? `${weeksAgo} Weeks Ago` : 'Earlier';
      
      if (weeksAgo <= 4) {
        weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
      }
    });
    
    const labels = ['4 Weeks Ago', '3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'This Week'];
    return labels.map(label => ({
      week: label,
      plans: weeks[label] || 0
    }));
  }, [mealPlans]);

  // Calculate per-plan comparison data
  const planComparisonData = React.useMemo(() => {
    return mealPlans.slice(0, 5).map(plan => {
      let totalCals = 0;
      let dayCount = plan.days?.length || 0;
      
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) totalCals += parseInt(match[1]);
          }
        });
      });
      
      const avgPerDay = dayCount > 0 ? Math.round(totalCals / dayCount) : 0;
      
      return {
        name: plan.name.length > 20 ? plan.name.substring(0, 20) + '...' : plan.name,
        calories: avgPerDay,
        budget: plan.estimated_cost || plan.current_total_cost || 0,
        days: dayCount
      };
    });
  }, [mealPlans]);

  // Budget analysis
  const budgetData = React.useMemo(() => {
    const data = [];
    mealPlans.forEach(plan => {
      if (plan.estimated_cost || plan.current_total_cost) {
        data.push({
          plan: plan.name.length > 15 ? plan.name.substring(0, 15) + '...' : plan.name,
          estimated: plan.estimated_cost || 0,
          actual: plan.current_total_cost || 0
        });
      }
    });
    return data.slice(0, 5);
  }, [mealPlans]);

  const totalMeals = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0) * 4, 0);
  
  const avgCalories = React.useMemo(() => {
    if (mealPlans.length === 0) return 0;
    
    let totalCals = 0;
    let dayCount = 0;
    
    mealPlans.forEach(plan => {
      plan.days?.forEach(day => {
        let dayCals = 0;
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) {
              dayCals += parseInt(match[1]);
            }
          }
        });
        if (dayCals > 0) {
          totalCals += dayCals;
          dayCount++;
        }
      });
    });
    
    return dayCount > 0 ? Math.round(totalCals / dayCount) : 0;
  }, [mealPlans]);

  const totalDaysPlanned = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0), 0);

  const stats = [
    { title: 'Total Plans Created', value: mealPlans.length, icon: Calendar, color: 'indigo' },
    { title: 'Total Meals', value: totalMeals, icon: Target, color: 'emerald' },
    { title: 'Avg Calories/Day', value: avgCalories > 0 ? avgCalories.toLocaleString() : 'N/A', icon: Flame, color: 'orange' },
    { title: 'Days Planned', value: totalDaysPlanned, icon: TrendingUp, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-600 mt-1">
          Track your nutrition planning progress and trends
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
          };
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Macronutrient Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Macronutrient Balance</CardTitle>
              <CardDescription>Protein, carbs, and fat distribution across all plans</CardDescription>
            </CardHeader>
            <CardContent>
              {macroDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={macroDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MACRO_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Math.round(value)}g`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>No meal plans created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cultural Cuisine Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Cuisine Style Preferences</CardTitle>
              <CardDescription>Cultural styles across your meal plans</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>No meal plans created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-Plan Calorie Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Meal Plan Comparison</CardTitle>
              <CardDescription>Average daily calories per meal plan</CardDescription>
            </CardHeader>
            <CardContent>
              {planComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={planComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="calories" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>Create meal plans to see comparisons</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Tracking */}
        {budgetData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Budget Analysis</CardTitle>
                <CardDescription>Estimated vs actual grocery costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="plan" stroke="#64748b" angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Bar dataKey="estimated" fill="#10b981" radius={[8, 8, 0, 0]} name="Estimated" />
                    <Bar dataKey="actual" fill="#6366f1" radius={[8, 8, 0, 0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {macroDistribution.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Macronutrient Balance</h4>
                  <p className="text-sm text-blue-700">
                    Your macros: {macroDistribution.find(m => m.name === 'Protein')?.percentage}% protein, {macroDistribution.find(m => m.name === 'Carbs')?.percentage}% carbs, {macroDistribution.find(m => m.name === 'Fat')?.percentage}% fat. {macroDistribution.find(m => m.name === 'Protein')?.percentage >= 25 ? 'Great protein intake!' : 'Consider increasing protein for better satiety'}
                  </p>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 mb-2">Planning Activity</h4>
                <p className="text-sm text-emerald-700">
                  {mealPlans.length > 0 ? `You've created ${mealPlans.length} meal plan${mealPlans.length === 1 ? '' : 's'} with ${totalMeals} total meals. ${totalDaysPlanned} days of nutrition planned!` : 'Start creating meal plans to track your progress'}
                </p>
              </div>
              
              {avgCalories > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2">Calorie Tracking</h4>
                  <p className="text-sm text-amber-700">
                    Average {avgCalories} cal/day across all plans. {avgCalories >= 1800 && avgCalories <= 2200 ? 'Well-balanced for most adults' : avgCalories < 1800 ? 'Lower range - ensure adequate nutrition' : 'Higher range - adjust based on your goals'}
                  </p>
                </div>
              )}
              
              {budgetData.length > 0 && (
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Budget Insight</h4>
                  <p className="text-sm text-purple-700">
                    Tracking ${budgetData.reduce((sum, d) => sum + d.actual, 0).toFixed(0)} in grocery costs across {budgetData.length} plan{budgetData.length === 1 ? '' : 's'}. {budgetData.every(d => d.actual <= d.estimated) ? 'Staying within budget!' : 'Some plans over budget'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}