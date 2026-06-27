"""Composite strategy base classes.

Each base class pre-wires a common two-signal pattern so the agent
generates working code by filling in one abstract method rather than
writing all boilerplate from scratch.
"""

from helix.strategies.composite.trend_filter import TrendFilterStrategy
from helix.strategies.composite.momentum_confirmation import MomentumConfirmationStrategy
from helix.strategies.composite.mean_reversion_gate import MeanReversionGateStrategy
from helix.strategies.composite.funding_regime import FundingRegimeStrategy

__all__ = [
    "TrendFilterStrategy",
    "MomentumConfirmationStrategy",
    "MeanReversionGateStrategy",
    "FundingRegimeStrategy",
]
