import "./HelpButton.css";

export const HelpButton = () => {
  return (
    <div className="help-button">
      ?
      <div className="help-tooltip">
        Questions or support:{" "}
        <span className="help-email">noritheshibadev@gmail.com</span>
      </div>
    </div>
  );
};
