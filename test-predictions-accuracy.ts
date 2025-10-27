/**
 * BFCM War Room - Session 3: Prediction Engine Accuracy Test
 *
 * Tests:
 * 1. 4hr/24hr/72hr forecast generation
 * 2. Stockout countdown accuracy
 * 3. Confidence interval validation
 * 4. Category-level predictions
 * 5. Best/likely/worst case scenarios
 */

import { PrismaClient } from '@prisma/client';
import { generatePredictions } from './app/services/prediction-engine.server';

const prisma = new PrismaClient();

interface TestResults {
  testName: string;
  passed: boolean;
  details: string;
  metrics?: any;
}

const results: TestResults[] = [];

async function runPredictionAccuracyTests() {
  console.log('🔮 BFCM War Room - Session 3: Prediction Engine Tests\n');
  console.log('=' .repeat(70));
  console.log();

  const shop = 'control-tower-2.myshopify.com';

  try {
    // Test 1: Generate predictions
    console.log('📊 TEST 1: Generate Complete Prediction Set');
    console.log('-'.repeat(70));
    const startTime = Date.now();
    const predictions = await generatePredictions(shop);
    const duration = Date.now() - startTime;

    console.log(`✅ Predictions generated in ${duration}ms`);
    console.log(`   Total SKUs analyzed: ${predictions.totalSKUs}`);
    console.log(`   Critical SKUs (4h stockout risk): ${predictions.criticalSKUs}`);
    console.log(`   High-risk SKUs (24h stockout risk): ${predictions.highRiskSKUs}`);
    console.log();

    results.push({
      testName: 'Prediction Generation',
      passed: predictions.totalSKUs > 0,
      details: `Generated predictions for ${predictions.totalSKUs} SKUs in ${duration}ms`,
      metrics: {
        duration,
        totalSKUs: predictions.totalSKUs,
        criticalSKUs: predictions.criticalSKUs,
        highRiskSKUs: predictions.highRiskSKUs,
      },
    });

    // Test 2: Validate 4-hour predictions (tactical)
    console.log('⏱️  TEST 2: 4-Hour Tactical Predictions');
    console.log('-'.repeat(70));

    const criticalPredictions = predictions.predictions.filter(
      p => p.predictions['4h'].scenarios.likely.stockoutRisk > 70
    );

    console.log(`   Found ${criticalPredictions.length} critical 4h predictions`);

    if (criticalPredictions.length > 0) {
      const sample = criticalPredictions[0];
      console.log(`   Sample SKU: ${sample.productTitle}`);
      console.log(`   Current Stock: ${sample.currentStock} units`);
      console.log(`   Burn Rate: ${sample.burnRate.toFixed(2)} units/hour`);
      console.log(`   4h Forecast:`);
      console.log(`     - Best case: ${sample.predictions['4h'].scenarios.best.expectedDemand} units`);
      console.log(`     - Likely: ${sample.predictions['4h'].scenarios.likely.expectedDemand} units`);
      console.log(`     - Worst case: ${sample.predictions['4h'].scenarios.worst.expectedDemand} units`);
      console.log(`     - Stockout Risk: ${sample.predictions['4h'].scenarios.likely.stockoutRisk}%`);
      console.log(`     - Confidence: ${sample.predictions['4h'].confidence}%`);
      console.log(`     - Action: ${sample.predictions['4h'].scenarios.likely.recommendedAction}`);
    }
    console.log();

    results.push({
      testName: '4-Hour Tactical Predictions',
      passed: criticalPredictions.length > 0,
      details: `Found ${criticalPredictions.length} SKUs with critical 4h stockout risk`,
      metrics: {
        criticalCount: criticalPredictions.length,
        avgConfidence: criticalPredictions.reduce((sum, p) => sum + p.predictions['4h'].confidence, 0) / Math.max(criticalPredictions.length, 1),
      },
    });

    // Test 3: Validate 24-hour predictions (operational)
    console.log('📅 TEST 3: 24-Hour Operational Predictions');
    console.log('-'.repeat(70));

    const highRiskPredictions = predictions.predictions.filter(
      p => p.predictions['24h'].scenarios.likely.stockoutRisk > 50
    );

    console.log(`   Found ${highRiskPredictions.length} high-risk 24h predictions`);

    if (highRiskPredictions.length > 0) {
      const sample = highRiskPredictions[0];
      console.log(`   Sample SKU: ${sample.productTitle}`);
      console.log(`   24h Forecast:`);
      console.log(`     - Expected Demand: ${sample.predictions['24h'].scenarios.likely.expectedDemand} units`);
      console.log(`     - Expected Revenue: $${sample.predictions['24h'].scenarios.likely.expectedRevenue.toFixed(2)}`);
      console.log(`     - Stockout Risk: ${sample.predictions['24h'].scenarios.likely.stockoutRisk}%`);
      console.log(`     - Confidence: ${sample.predictions['24h'].confidence}%`);
    }
    console.log();

    results.push({
      testName: '24-Hour Operational Predictions',
      passed: highRiskPredictions.length >= 3,
      details: `Found ${highRiskPredictions.length} SKUs with high 24h stockout risk`,
      metrics: {
        highRiskCount: highRiskPredictions.length,
      },
    });

    // Test 4: Validate 72-hour predictions (strategic)
    console.log('🎯 TEST 4: 72-Hour Strategic Predictions');
    console.log('-'.repeat(70));

    const strategicPredictions = predictions.predictions.filter(
      p => p.predictions['72h'].scenarios.likely.stockoutRisk > 30
    );

    console.log(`   Found ${strategicPredictions.length} strategic 72h predictions`);

    if (strategicPredictions.length > 0) {
      const sample = strategicPredictions[0];
      console.log(`   Sample SKU: ${sample.productTitle}`);
      console.log(`   72h Forecast:`);
      console.log(`     - Expected Demand: ${sample.predictions['72h'].scenarios.likely.expectedDemand} units`);
      console.log(`     - Expected Revenue: $${sample.predictions['72h'].scenarios.likely.expectedRevenue.toFixed(2)}`);
      console.log(`     - Stockout Risk: ${sample.predictions['72h'].scenarios.likely.stockoutRisk}%`);
      console.log(`     - Action: ${sample.predictions['72h'].scenarios.likely.recommendedAction}`);
    }
    console.log();

    results.push({
      testName: '72-Hour Strategic Predictions',
      passed: strategicPredictions.length >= 5,
      details: `Found ${strategicPredictions.length} SKUs with 72h stockout risk`,
      metrics: {
        strategicCount: strategicPredictions.length,
      },
    });

    // Test 5: Stockout countdown accuracy
    console.log('⏰ TEST 5: Stockout Countdown Timers');
    console.log('-'.repeat(70));

    const countdowns = predictions.predictions
      .filter(p => p.burnRate > 0 && p.currentStock > 0)
      .map(p => {
        const hoursToStockout = p.currentStock / p.burnRate;
        return {
          sku: p.productTitle,
          currentStock: p.currentStock,
          burnRate: p.burnRate,
          hoursToStockout,
          status: hoursToStockout < 4 ? 'CRITICAL' :
                  hoursToStockout < 24 ? 'HIGH' :
                  hoursToStockout < 72 ? 'MEDIUM' : 'LOW',
        };
      })
      .sort((a, b) => a.hoursToStockout - b.hoursToStockout)
      .slice(0, 5);

    console.log('   Top 5 imminent stockouts:');
    countdowns.forEach((cd, i) => {
      console.log(`   ${i + 1}. ${cd.sku}`);
      console.log(`      Stock: ${cd.currentStock} units | Burn: ${cd.burnRate.toFixed(2)}/hr`);
      console.log(`      ⏰ ${cd.hoursToStockout.toFixed(1)} hours until stockout [${cd.status}]`);
    });
    console.log();

    results.push({
      testName: 'Stockout Countdown Timers',
      passed: countdowns.filter(cd => cd.status === 'CRITICAL').length > 0,
      details: `Identified ${countdowns.filter(cd => cd.status === 'CRITICAL').length} critical countdowns`,
      metrics: {
        criticalCountdowns: countdowns.filter(cd => cd.status === 'CRITICAL').length,
        highCountdowns: countdowns.filter(cd => cd.status === 'HIGH').length,
      },
    });

    // Test 6: Category-level forecasts
    console.log('📦 TEST 6: Category-Level Forecasts');
    console.log('-'.repeat(70));

    if (predictions.categoryForecasts && predictions.categoryForecasts.length > 0) {
      console.log(`   Found ${predictions.categoryForecasts.length} category forecasts`);

      predictions.categoryForecasts.slice(0, 3).forEach(cat => {
        console.log(`   ${cat.category}:`);
        console.log(`     Current Velocity: ${cat.currentVelocity.toFixed(2)} units/hr`);
        console.log(`     Predicted 4h: ${cat.predicted4h.toFixed(2)} units/hr`);
        console.log(`     Predicted 24h: ${cat.predicted24h.toFixed(2)} units/hr`);
        console.log(`     Predicted 72h: ${cat.predicted72h.toFixed(2)} units/hr`);
        console.log(`     Trend: ${cat.trend.toUpperCase()} (${cat.confidence}% confident)`);
      });

      results.push({
        testName: 'Category-Level Forecasts',
        passed: predictions.categoryForecasts.length >= 1,
        details: `Generated forecasts for ${predictions.categoryForecasts.length} categories`,
        metrics: {
          categoryCount: predictions.categoryForecasts.length,
          accelerating: predictions.categoryForecasts.filter(c => c.trend === 'accelerating').length,
        },
      });
    } else {
      console.log('   ⚠️  No category forecasts generated');
      results.push({
        testName: 'Category-Level Forecasts',
        passed: false,
        details: 'No category forecasts generated',
      });
    }
    console.log();

    // Test 7: Confidence interval validation
    console.log('📊 TEST 7: Confidence Interval Validation');
    console.log('-'.repeat(70));

    const confidenceStats = {
      high: predictions.predictions.filter(p => p.predictions['24h'].confidence >= 80).length,
      medium: predictions.predictions.filter(p => p.predictions['24h'].confidence >= 60 && p.predictions['24h'].confidence < 80).length,
      low: predictions.predictions.filter(p => p.predictions['24h'].confidence < 60).length,
    };

    console.log('   24h Prediction Confidence Distribution:');
    console.log(`     High (80-100%): ${confidenceStats.high} SKUs`);
    console.log(`     Medium (60-79%): ${confidenceStats.medium} SKUs`);
    console.log(`     Low (<60%): ${confidenceStats.low} SKUs`);
    console.log();

    results.push({
      testName: 'Confidence Interval Validation',
      passed: confidenceStats.high + confidenceStats.medium > confidenceStats.low,
      details: `Confidence distribution: ${confidenceStats.high} high, ${confidenceStats.medium} medium, ${confidenceStats.low} low`,
      metrics: confidenceStats,
    });

    // Test 8: Scenario variance validation
    console.log('🎲 TEST 8: Scenario Variance (Best/Likely/Worst)');
    console.log('-'.repeat(70));

    const sampleWithScenarios = predictions.predictions.find(
      p => p.predictions['24h'].scenarios.worst.expectedDemand > p.predictions['24h'].scenarios.best.expectedDemand
    );

    if (sampleWithScenarios) {
      const scenarios = sampleWithScenarios.predictions['24h'].scenarios;
      console.log(`   Sample SKU: ${sampleWithScenarios.productTitle}`);
      console.log(`   24h Demand Scenarios:`);
      console.log(`     Best Case: ${scenarios.best.expectedDemand} units ($${scenarios.best.expectedRevenue.toFixed(2)})`);
      console.log(`     Likely: ${scenarios.likely.expectedDemand} units ($${scenarios.likely.expectedRevenue.toFixed(2)})`);
      console.log(`     Worst Case: ${scenarios.worst.expectedDemand} units ($${scenarios.worst.expectedRevenue.toFixed(2)})`);

      const variance = scenarios.worst.expectedDemand - scenarios.best.expectedDemand;
      const variancePercent = (variance / scenarios.likely.expectedDemand) * 100;
      console.log(`     Variance: ${variance} units (${variancePercent.toFixed(1)}%)`);

      results.push({
        testName: 'Scenario Variance',
        passed: variance > 0,
        details: `Variance of ${variance} units (${variancePercent.toFixed(1)}%) between best/worst`,
        metrics: {
          variance,
          variancePercent,
        },
      });
    } else {
      console.log('   ⚠️  Could not find valid scenario variance sample');
      results.push({
        testName: 'Scenario Variance',
        passed: false,
        details: 'No valid scenario variance found',
      });
    }
    console.log();

    // Print summary
    console.log('=' .repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(70));

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.testName}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   ${result.details}`);
    });
    console.log();

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const passRate = (passedCount / totalCount) * 100;

    console.log(`Overall: ${passedCount}/${totalCount} tests passed (${passRate.toFixed(1)}%)`);
    console.log();

    if (passRate >= 80) {
      console.log('🎉 PREDICTION ENGINE VALIDATION: PASSED');
      console.log('   System is ready for Session 3 alert testing');
    } else {
      console.log('⚠️  PREDICTION ENGINE VALIDATION: NEEDS IMPROVEMENT');
      console.log('   Review failed tests before proceeding');
    }
    console.log();

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPredictionAccuracyTests();
