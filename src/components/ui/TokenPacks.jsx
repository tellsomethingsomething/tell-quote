import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Rocket, Loader2 } from 'lucide-react';
import { tokenPacks, tokenEstimates, formatPrice } from '../../data/pricing';
import { useAuthStore } from '../../store/authStore';
import { createTokenPackCheckoutSession } from '../../services/billingService';
import logger from '../../utils/logger';

const packIcons = [Sparkles, Zap, Rocket];
const packNames = ['Starter', 'Popular', 'Power User'];

export default function TokenPacks({ currency = 'USD', showBuyButtons = true }) {
    const [loadingPack, setLoadingPack] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const handleBuyTokens = async (pack) => {
        setError(null);

        if (!isAuthenticated) {
            // Redirect to signup/login first
            navigate('/auth/login?redirect=/pricing#tokens');
            return;
        }

        setLoadingPack(pack.tokens);
        try {
            const { url } = await createTokenPackCheckoutSession(pack.tokens, currency);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            logger.error('Token purchase error:', err);
            setError('Unable to start checkout. Please try again.');
            setLoadingPack(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Error Message */}
            {error && (
                <div className="max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Token Packs */}
            <div className="grid md:grid-cols-3 gap-6">
                {tokenPacks.map((pack, i) => {
                    const Icon = packIcons[i];
                    const price = pack.pricing[currency] || pack.pricing.USD;

                    return (
                        <motion.div
                            key={pack.tokens}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative bg-marketing-surface border ${
                                pack.popular
                                    ? 'border-marketing-primary shadow-lg shadow-marketing-primary/10'
                                    : 'border-marketing-border'
                            } rounded-xl p-6 text-center`}
                        >
                            {pack.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-marketing-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Best Value
                                </div>
                            )}

                            <div className={`inline-flex p-3 rounded-xl mb-4 ${
                                pack.popular ? 'bg-marketing-primary/20' : 'bg-marketing-surface'
                            }`}>
                                <Icon className={`w-6 h-6 ${pack.popular ? 'text-marketing-primary' : 'text-marketing-text-secondary'}`} />
                            </div>

                            <h3 className="text-lg font-bold text-marketing-text-primary mb-1">
                                {packNames[i]}
                            </h3>
                            <p className="text-2xl font-bold text-marketing-primary mb-1">
                                {pack.tokens.toLocaleString()}
                            </p>
                            <p className="text-sm text-marketing-text-secondary mb-4">tokens</p>

                            <div className="text-3xl font-bold text-marketing-text-primary mb-4">
                                {formatPrice(price, currency)}
                            </div>

                            <p className="text-xs text-marketing-text-secondary mb-4">
                                {formatPrice((price / pack.tokens * 1000).toFixed(2), currency)} per 1,000 tokens
                            </p>

                            {showBuyButtons && (
                                <button
                                    onClick={() => handleBuyTokens(pack)}
                                    disabled={loadingPack === pack.tokens}
                                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-wait ${
                                        pack.popular
                                            ? 'bg-marketing-primary text-white hover:bg-marketing-primary/90'
                                            : 'bg-marketing-surface border border-marketing-border text-marketing-text-primary hover:border-marketing-primary'
                                    }`}
                                >
                                    {loadingPack === pack.tokens ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading...
                                        </span>
                                    ) : (
                                        'Buy Now'
                                    )}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Token Usage Estimates */}
            <div className="bg-marketing-surface/50 border border-marketing-border rounded-xl p-6">
                <h4 className="text-sm font-bold text-marketing-text-secondary uppercase tracking-wider mb-4">
                    What can you do with tokens?
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.values(tokenEstimates).map((estimate, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-marketing-primary font-bold min-w-[60px]">
                                ~{estimate.tokens}
                            </span>
                            <span className="text-marketing-text-secondary">
                                {estimate.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
