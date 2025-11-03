import React from "react";
import "./BuyMeCoffee.css";

export const BuyMeCoffee: React.FC = () => {
  return (
    <div className="buy-me-coffee">
      <a
        href="https://buymeacoffee.com/shibadev"
        target="_blank"
        rel="noopener noreferrer"
        className="buy-me-coffee-link"
      >
        <img
          src="/icons/shiba.png"
          alt="Nori the shiba"
          className="shiba-icon"
        />
        <span>Buy Nori a Treat</span>
      </a>
    </div>
  );
};
