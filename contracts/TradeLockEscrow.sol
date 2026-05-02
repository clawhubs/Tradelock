// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract TradeLockEscrow {
    enum DealStatus {
        Draft,
        Created,
        Funded,
        ProofSubmitted,
        Released,
        Disputed,
        Frozen,
        Cancelled
    }

    struct Deal {
        string id;
        address buyer;
        address seller;
        address settlementToken;
        uint256 amount;
        string metadataURI;
        string proofHash;
        DealStatus status;
        bool exists;
    }

    mapping(bytes32 => Deal) private deals;

    address public owner;
    address public arbitrator;

    event DealCreated(
        string indexed dealId,
        address indexed buyer,
        address indexed seller,
        address settlementToken,
        uint256 amount,
        string metadataURI
    );
    event EscrowFunded(string indexed dealId, address indexed buyer, uint256 amount);
    event ProofSubmitted(string indexed dealId, address indexed actor, string proofHash);
    event FundsReleased(string indexed dealId, address indexed seller, uint256 amount);
    event DisputeOpened(string indexed dealId, address indexed actor, string reason);
    event DealFrozen(string indexed dealId);
    event DealCancelled(string indexed dealId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBuyer(string calldata dealId) {
        require(_loadDeal(dealId).buyer == msg.sender, "Only buyer");
        _;
    }

    modifier onlyBuyerOrSeller(string calldata dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(msg.sender == deal.buyer || msg.sender == deal.seller, "Only participants");
        _;
    }

    modifier onlyOwnerOrArbitrator() {
        require(msg.sender == owner || msg.sender == arbitrator, "Only owner or arbitrator");
        _;
    }

    constructor(address initialArbitrator) {
        owner = msg.sender;
        arbitrator = initialArbitrator;
    }

    function setArbitrator(address nextArbitrator) external onlyOwner {
        arbitrator = nextArbitrator;
    }

    function createDeal(
        string calldata dealId,
        address seller,
        address settlementToken,
        uint256 amount,
        string calldata metadataURI
    ) external {
        require(bytes(dealId).length > 0, "Deal ID required");
        require(seller != address(0), "Seller required");
        require(settlementToken != address(0), "Token required");
        require(amount > 0, "Amount required");

        bytes32 key = _dealKey(dealId);
        require(!deals[key].exists, "Deal exists");

        deals[key] = Deal({
            id: dealId,
            buyer: msg.sender,
            seller: seller,
            settlementToken: settlementToken,
            amount: amount,
            metadataURI: metadataURI,
            proofHash: "",
            status: DealStatus.Created,
            exists: true
        });

        emit DealCreated(dealId, msg.sender, seller, settlementToken, amount, metadataURI);
    }

    function fundDeal(string calldata dealId) external onlyBuyer(dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(deal.status == DealStatus.Created, "Deal not fundable");

        require(
            IERC20Like(deal.settlementToken).transferFrom(msg.sender, address(this), deal.amount),
            "Funding transfer failed"
        );

        deal.status = DealStatus.Funded;
        emit EscrowFunded(dealId, msg.sender, deal.amount);
    }

    function submitProofHash(string calldata dealId, string calldata proofHash) external onlyBuyerOrSeller(dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(deal.status == DealStatus.Funded || deal.status == DealStatus.ProofSubmitted, "Deal not ready");
        require(bytes(proofHash).length > 0, "Proof hash required");

        deal.proofHash = proofHash;
        deal.status = DealStatus.ProofSubmitted;

        emit ProofSubmitted(dealId, msg.sender, proofHash);
    }

    function releaseFunds(string calldata dealId) external onlyBuyer(dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(
            deal.status == DealStatus.Funded || deal.status == DealStatus.ProofSubmitted,
            "Deal not releasable"
        );

        deal.status = DealStatus.Released;
        require(IERC20Like(deal.settlementToken).transfer(deal.seller, deal.amount), "Release transfer failed");

        emit FundsReleased(dealId, deal.seller, deal.amount);
    }

    function openDispute(string calldata dealId, string calldata reason) external onlyBuyerOrSeller(dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(
            deal.status == DealStatus.Funded || deal.status == DealStatus.ProofSubmitted,
            "Deal not disputable"
        );

        deal.status = DealStatus.Disputed;
        emit DisputeOpened(dealId, msg.sender, reason);
    }

    function freezeDeal(string calldata dealId) external onlyOwnerOrArbitrator {
        Deal storage deal = _loadDeal(dealId);
        require(deal.status == DealStatus.Disputed, "Deal not disputed");

        deal.status = DealStatus.Frozen;
        emit DealFrozen(dealId);
    }

    function cancelDeal(string calldata dealId) external onlyBuyer(dealId) {
        Deal storage deal = _loadDeal(dealId);
        require(deal.status == DealStatus.Created, "Deal not cancellable");

        deal.status = DealStatus.Cancelled;
        emit DealCancelled(dealId);
    }

    function getDeal(
        string calldata dealId
    )
        external
        view
        returns (
            string memory id,
            address buyer,
            address seller,
            address settlementToken,
            uint256 amount,
            string memory metadataURI,
            string memory proofHash,
            uint8 status
        )
    {
        Deal storage deal = _loadDeal(dealId);
        return (
            deal.id,
            deal.buyer,
            deal.seller,
            deal.settlementToken,
            deal.amount,
            deal.metadataURI,
            deal.proofHash,
            uint8(deal.status)
        );
    }

    function _dealKey(string calldata dealId) internal pure returns (bytes32) {
        return keccak256(bytes(dealId));
    }

    function _loadDeal(string calldata dealId) internal view returns (Deal storage) {
        Deal storage deal = deals[_dealKey(dealId)];
        require(deal.exists, "Deal not found");
        return deal;
    }
}
